const { promisify } = require('util');
const { exec } = require('child_process');
const ip = require('ip');
const macLookup = require('mac-lookup');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);
const parseStringPromise = xml2js.parseStringPromise;

const trustedDevicesDbPath = path.join(__dirname, '..', 'trusted-devices.json');

/**
 * Discovers all devices on the local network using Nmap.
 */
exports.discoverDevices = async (req, res) => {
  console.log('🚀 Starting network device discovery...');

  try {
    // --- IMPROVED NETWORK DETECTION ---
    let networkRange = null;
    const interfaces = os.networkInterfaces();
    const candidates = [];

    console.log('🔍 Available network interfaces:', Object.keys(interfaces));

    // Find all valid, non-internal IPv4 interfaces
    for (const [name, ifaces] of Object.entries(interfaces)) {
      if (!ifaces) continue;
      
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal && iface.address) {
          console.log(`📡 Found interface ${name}: ${iface.address}/${iface.netmask}`);
          candidates.push({ name, ...iface });
        }
      }
    }

    console.log(`🔢 Found ${candidates.length} candidate interfaces`);

    if (candidates.length > 0) {
      // Prioritize interfaces in this order:
      // 1. Standard home/office networks (192.168.x.x)
      // 2. Private class A networks (10.x.x.x)
      // 3. Private class B networks (172.16-31.x.x)
      // 4. Any other non-internal interface
      
      let preferredInterface = candidates.find(iface => 
        iface.address.startsWith('192.168.')
      ) || candidates.find(iface => 
        iface.address.startsWith('10.')
      ) || candidates.find(iface => 
        iface.address.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      ) || candidates[0];
      
      console.log(`✅ Selected interface: ${preferredInterface.name} (${preferredInterface.address})`);
      
      try {
        // Use the ip library to calculate CIDR
        const subnetInfo = ip.subnet(preferredInterface.address, preferredInterface.netmask);
        networkRange = subnetInfo.networkAddress + '/' + subnetInfo.subnetMaskLength;
        console.log(`🎯 Calculated network range: ${networkRange}`);
      } catch (subnetError) {
        console.warn('⚠️ Failed to calculate subnet, using fallback method');
        // Fallback: assume /24 network for common ranges
        if (preferredInterface.address.startsWith('192.168.') || 
            preferredInterface.address.startsWith('10.') ||
            preferredInterface.address.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          const parts = preferredInterface.address.split('.');
          networkRange = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
        } else {
          // Last resort: scan just a /24 around the current IP
          const parts = preferredInterface.address.split('.');
          networkRange = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
        }
        console.log(`🔄 Using fallback range: ${networkRange}`);
      }
    }
    
    // Additional fallback if still no range found
    if (!networkRange) {
      console.warn('⚠️ No suitable interface found, using default range');
      networkRange = '192.168.1.0/24'; // Most common home network
    }
    
    console.log(`🔍 Final scan range: ${networkRange}`);

    // Execute nmap scan
    const nmapCommand = `nmap -sn -oX - ${networkRange}`;
    console.log(`🛠️ Executing: ${nmapCommand}`);
    
    const { stdout, stderr } = await execAsync(nmapCommand);
    
    if (stderr) {
      console.warn('⚠️ Nmap warnings:', stderr);
    }

    const parsedXml = await parseStringPromise(stdout);
    const hosts = parsedXml.nmaprun.host || [];
    
    console.log(`📊 Raw nmap found ${hosts.length} hosts`);
    
    let trustedMacs = [];
    try {
      const trustedDevicesData = await fs.readFile(trustedDevicesDbPath, 'utf8');
      trustedMacs = JSON.parse(trustedDevicesData);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      console.warn('⚠️ trusted-devices.json not found. Assuming no trusted devices.');
    }

    const discoveredDevices = hosts.map(host => {
      const addresses = host.address || [];
      const ipAddr = addresses.find(addr => addr.$.addrtype === 'ipv4')?.$.addr;
      const macAddr = addresses.find(addr => addr.$.addrtype === 'mac')?.$.addr;
      
      let vendor = null;
      if (macAddr) {
        try {
          vendor = macLookup.lookup(macAddr) || 'Unknown';
        } catch (e) { 
          vendor = 'Unknown';
        }
      }

      const device = {
        ip: ipAddr,
        mac: macAddr || null,
        vendor: vendor,
        isTrusted: macAddr ? trustedMacs.includes(macAddr) : false
      };
      
      console.log(`📱 Found device: ${device.ip} ${device.mac ? `(${device.mac})` : '(no MAC)'} - ${device.vendor || 'N/A'}`);
      return device;
    }).filter(device => device.ip);

    console.log(`✅ Network scan complete. Found ${discoveredDevices.length} devices.`);
    res.status(200).json(discoveredDevices);

  } catch (error) {
    console.error('❌ Network discovery failed:', error);
    if (error.message.includes('command not found') || error.message.includes('nmap')) {
      return res.status(500).json({ 
        message: 'Nmap command not found. Please ensure Nmap is installed on the server.',
        details: 'Run: sudo apt-get install nmap (Ubuntu/Debian) or brew install nmap (macOS)'
      });
    }
    res.status(500).json({ 
      message: 'An error occurred during network discovery.', 
      error: error.message 
    });
  }
};


/// Adds a device's MAC address to the trusted list.
 
exports.trustDevice = async (req, res) => {
  const { mac } = req.body;

  if (!mac) {
    return res.status(400).json({ message: 'MAC address is required.' });
  }

  try {
    let trustedMacs = [];
    try {
      const trustedDevicesData = await fs.readFile(trustedDevicesDbPath, 'utf8');
      trustedMacs = JSON.parse(trustedDevicesData);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      console.log('Creating new trusted-devices.json file.');
    }

    if (!trustedMacs.includes(mac)) {
      trustedMacs.push(mac);
      await fs.writeFile(trustedDevicesDbPath, JSON.stringify(trustedMacs, null, 2));
      console.log(`👍 Trusted new device: ${mac}`);
    }

    res.status(200).json({ message: 'Device has been trusted successfully.' });

  } catch (error) {
    console.error('❌ Failed to trust device:', error);
    res.status(500).json({ message: 'An error occurred while trusting the device.', error: error.message });
  }
};