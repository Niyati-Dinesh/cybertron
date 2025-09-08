const { exec } = require('child_process');
const { PrismaClient } = require('../generated/prisma');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Helper function to get system information
const getSystemInfo = async () => {
  try {
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)), // GB
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)), // GB
      uptime: Math.round(os.uptime() / 3600), // hours
      nodeVersion: process.version,
    };

    // Get OS release information (Linux/Unix)
    if (os.platform() === 'linux' || os.platform() === 'darwin') {
      try {
        const { stdout: osRelease } = await execAsync('cat /etc/os-release 2>/dev/null || sw_vers 2>/dev/null || echo "OS_INFO_NOT_AVAILABLE"');
        systemInfo.osRelease = osRelease.trim();
      } catch (error) {
        systemInfo.osRelease = 'Not available';
      }

      // Get kernel version
      try {
        const { stdout: kernelVersion } = await execAsync('uname -r');
        systemInfo.kernelVersion = kernelVersion.trim();
      } catch (error) {
        systemInfo.kernelVersion = 'Not available';
      }

      // Get OS version
      try {
        const { stdout: osVersion } = await execAsync('uname -s -r -v');
        systemInfo.osVersion = osVersion.trim();
      } catch (error) {
        systemInfo.osVersion = 'Not available';
      }
    } else if (os.platform() === 'win32') {
      // Windows system information
      try {
        const { stdout: windowsVersion } = await execAsync('ver');
        systemInfo.osVersion = windowsVersion.trim();
      } catch (error) {
        systemInfo.osVersion = 'Not available';
      }
      
      try {
        const { stdout: systemInfo32 } = await execAsync('systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
        systemInfo.osRelease = systemInfo32.trim();
      } catch (error) {
        systemInfo.osRelease = 'Not available';
      }
      
      systemInfo.kernelVersion = 'N/A (Windows)';
    }

    // Get load average (Unix/Linux only)
    if (os.platform() !== 'win32') {
      const loadAvg = os.loadavg();
      systemInfo.loadAverage = {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2)
      };
    }

    return systemInfo;
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      error: 'Could not retrieve complete system information'
    };
  }
};

exports.getProcesses = async (req, res) => {
  const command = 'ps -eo pid,comm,%cpu,%mem,user,etime,args';
  
  try {
    // Get system information first
    const systemInfo = await getSystemInfo();
    
    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).json({ 
          message: 'Failed to retrieve processes',
          systemInfo: systemInfo // Still send system info even if processes fail
        });
      }
      
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      const lines = stdout.trim().split('\n');
      const processes = [];
      const trustedProcesses = await prisma.trustedProcess.findMany();
      
      const isTrusted = (comm, args) => {
        return trustedProcesses.some(
          (p) => p.comm === comm && p.args === args
        );
      };

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        const args = lines[i].trim().substring(lines[i].trim().indexOf(parts[6]));
        let severity = 'Low';
        const user = parts[4];
        const cpu = parseFloat(parts[2]);
        const mem = parseFloat(parts[3]);

        // Rule 1: Execution from Suspicious Locations
        if (args.includes('/tmp') || args.includes('/Downloads') || args.includes('/var/tmp')) {
          severity = 'High';
        }

        // Rule 2: High Sustained CPU/Memory Usage
        if (cpu > 70) {
          if (severity === 'Low') severity = 'Medium';
        }
        if (mem > 50) {
          if (severity === 'Low') severity = 'Medium';
        }

        // Rule 3: Suspicious User / UID Mismatch
        if (user === 'root' && (args.includes('/home/') || args.includes('/root/') || args.includes('~'))) {
          if (severity === 'Low') severity = 'Medium';
        }

        // Optional Rule: Suspicious file execution (.sh or .exe)
        if (args.includes('/tmp') && (args.endsWith('.sh') || args.endsWith('.exe'))) {
          if (severity === 'Low') severity = 'Medium';
        }

        // Check against the trusted process list
        if (isTrusted(parts[1], args)) {
          severity = 'Trusted';
        }

        processes.push({
          pid: parts[0],
          comm: parts[1],
          cpu: cpu,
          mem: mem,
          user: user,
          etime: parts[5],
          args: args,
          severity: severity,
        });
      }

      // Send both processes and system information
      res.status(200).json({
        systemInfo: systemInfo,
        processes: processes,
        totalProcesses: processes.length,
        scanTimestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Error in getProcesses:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

exports.trustProcess = async (req, res) => {
  const { comm, args } = req.body;
  
  try {
    await prisma.trustedProcess.create({
      data: {
        comm,
        args,
      },
    });
    res.status(201).json({ message: 'Process has been marked as trusted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.killProcess = async (req, res) => {
  const { pid } = req.body;
  const command = `kill ${pid}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ message: `Failed to kill process with PID ${pid}` });
    }
    res.status(200).json({ message: `Process with PID ${pid} has been killed.` });
  });
};

// Optional: Add a separate endpoint for just system info
exports.getSystemInfo = async (req, res) => {
  try {
    const systemInfo = await getSystemInfo();
    res.status(200).json({
      systemInfo: systemInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve system information',
      error: error.message 
    });
  }
};