const { exec } = require("child_process");
const { PrismaClient } = require("../generated/prisma");
const os = require("os");
const { promisify } = require("util");

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
    if (os.platform() === "linux" || os.platform() === "darwin") {
      try {
        const { stdout: osRelease } = await execAsync(
          'cat /etc/os-release 2>/dev/null || sw_vers 2>/dev/null || echo "OS_INFO_NOT_AVAILABLE"'
        );
        systemInfo.osRelease = osRelease.trim();
      } catch (error) {
        systemInfo.osRelease = "Not available";
      }

      // Get kernel version
      try {
        const { stdout: kernelVersion } = await execAsync("uname -r");
        systemInfo.kernelVersion = kernelVersion.trim();
      } catch (error) {
        systemInfo.kernelVersion = "Not available";
      }

      // Get OS version
      try {
        const { stdout: osVersion } = await execAsync("uname -s -r -v");
        systemInfo.osVersion = osVersion.trim();
      } catch (error) {
        systemInfo.osVersion = "Not available";
      }
    } else if (os.platform() === "win32") {
      // Windows system information
      try {
        const { stdout: windowsVersion } = await execAsync("ver");
        systemInfo.osVersion = windowsVersion.trim();
      } catch (error) {
        systemInfo.osVersion = "Not available";
      }

      try {
        const { stdout: systemInfo32 } = await execAsync(
          'systeminfo | findstr /B /C:"OS Name" /C:"OS Version"'
        );
        systemInfo.osRelease = systemInfo32.trim();
      } catch (error) {
        systemInfo.osRelease = "Not available";
      }

      systemInfo.kernelVersion = "N/A (Windows)";
    }

    // Get load average (Unix/Linux only)
    if (os.platform() !== "win32") {
      const loadAvg = os.loadavg();
      systemInfo.loadAverage = {
        "1min": loadAvg[0].toFixed(2),
        "5min": loadAvg[1].toFixed(2),
        "15min": loadAvg[2].toFixed(2),
      };
    }

    return systemInfo;
  } catch (error) {
    console.error("Error getting system info:", error);
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      error: "Could not retrieve complete system information",
    };
  }
};

// Helper function to parse a single process line
const parseProcessLine = (line) => {
  // Remove extra whitespace and split by whitespace
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  // Split the line into parts, but be careful with the args field
  const parts = trimmedLine.split(/\s+/);
  
  if (parts.length < 6) return null; // Invalid line

  // Extract fixed fields
  const pid = parts[0];
  const comm = parts[1];
  const cpu = parts[2];
  const mem = parts[3];
  const user = parts[4];
  const etime = parts[5];
  
  // Everything after the 6th field is part of args
  const args = parts.slice(6).join(' ') || comm;

  return {
    pid: parseInt(pid) || 0,
    comm: comm || 'unknown',
    cpu: parseFloat(cpu) || 0.0,
    mem: parseFloat(mem) || 0.0,
    user: user || 'unknown',
    etime: etime || '00:00',
    args: args
  };
};

// Helper function to determine process severity
const calculateSeverity = (processData, trustedProcesses) => {
  const { comm, args, user, cpu, mem } = processData;
  
  // Check against the trusted process list first
  const isTrusted = trustedProcesses.some(
    (p) => p.comm === comm && p.args === args
  );
  
  if (isTrusted) {
    return "Trusted";
  }

  let severity = "Low";

  // Rule 1: Execution from Suspicious Locations
  if (
    args.includes("/tmp/") ||
    args.includes("/Downloads/") ||
    args.includes("/var/tmp/") ||
    args.includes("\\temp\\") ||
    args.includes("\\Downloads\\")
  ) {
    severity = "High";
  }

  // Rule 2: High Sustained CPU/Memory Usage
  if (cpu > 80.0) {
    severity = severity === "Low" ? "Medium" : severity;
  }
  
  if (mem > 60.0) {
    severity = severity === "Low" ? "Medium" : severity;
  }

  // Rule 3: Suspicious User / UID Mismatch
  if (user === "root" && (
    args.includes("/home/") ||
    args.includes("/root/") ||
    args.includes("~/")
  )) {
    severity = severity === "Low" ? "Medium" : severity;
  }

  // Rule 4: Suspicious file execution
  if (args.includes("/tmp/") && (
    args.includes(".sh") || 
    args.includes(".exe") || 
    args.includes(".py") ||
    args.includes(".pl") ||
    args.includes(".rb")
  )) {
    severity = severity === "Low" ? "High" : severity;
  }

  // Rule 5: Processes running with unusual names or paths
  if (
    comm.includes("..") ||
    comm.includes("/") ||
    comm.length === 1 ||
    /^[0-9]+$/.test(comm)
  ) {
    severity = severity === "Low" ? "Medium" : severity;
  }

  return severity;
};

exports.getProcesses = async (req, res) => {
  try {
    // Get system information first
    const systemInfo = await getSystemInfo();
    
    // Get trusted processes from database
    const trustedProcesses = await prisma.trustedProcess.findMany();

    // Execute multiple ps commands to get comprehensive data
    const commands = {
      basic: "ps -eo pid,comm,user,etime --no-headers",
      cpu: "ps -eo pid,%cpu --no-headers", 
      memory: "ps -eo pid,%mem,vsz,rss --no-headers",
      args: "ps -eo pid,args --no-headers"
    };

    // Execute all commands in parallel
    const [basicResult, cpuResult, memoryResult, argsResult] = await Promise.all([
      execAsync(commands.basic),
      execAsync(commands.cpu),
      execAsync(commands.memory),
      execAsync(commands.args)
    ]);

    // Parse each result into maps indexed by PID
    const basicMap = new Map();
    const cpuMap = new Map();
    const memoryMap = new Map();
    const argsMap = new Map();

    // Parse basic info (pid, comm, user, etime)
    basicResult.stdout.trim().split('\n').forEach(line => {
      if (!line.trim()) return;
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const pid = parseInt(parts[0]);
        basicMap.set(pid, {
          pid: pid,
          comm: parts[1],
          user: parts[2],
          etime: parts[3]
        });
      }
    });

    // Parse CPU info
    cpuResult.stdout.trim().split('\n').forEach(line => {
      if (!line.trim()) return;
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const pid = parseInt(parts[0]);
        const cpu = parseFloat(parts[1]) || 0.0;
        cpuMap.set(pid, cpu);
      }
    });

    // Parse memory info
    memoryResult.stdout.trim().split('\n').forEach(line => {
      if (!line.trim()) return;
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const pid = parseInt(parts[0]);
        const memPercent = parseFloat(parts[1]) || 0.0;
        const vsz = parseInt(parts[2]) || 0; // Virtual memory size in KB
        const rss = parseInt(parts[3]) || 0; // Resident set size in KB
        memoryMap.set(pid, {
          percent: memPercent,
          vsz: vsz,
          rss: rss
        });
      }
    });

    // Parse arguments
    argsResult.stdout.trim().split('\n').forEach(line => {
      if (!line.trim()) return;
      const spaceIndex = line.indexOf(' ');
      if (spaceIndex !== -1) {
        const pid = parseInt(line.substring(0, spaceIndex));
        const args = line.substring(spaceIndex + 1).trim();
        argsMap.set(pid, args);
      }
    });

    // Combine all data into process objects
    const processes = [];
    
    for (const [pid, basicInfo] of basicMap) {
      try {
        const cpu = cpuMap.get(pid) || 0.0;
        const memory = memoryMap.get(pid) || { percent: 0.0, vsz: 0, rss: 0 };
        const args = argsMap.get(pid) || basicInfo.comm;

        const processData = {
          pid: pid,
          comm: basicInfo.comm,
          cpu: cpu,
          mem: memory.percent,
          user: basicInfo.user,
          etime: basicInfo.etime,
          args: args,
          // Additional memory info
          memoryDetails: {
            virtualSize: Math.round(memory.vsz / 1024), // Convert to MB
            residentSize: Math.round(memory.rss / 1024), // Convert to MB
            percent: memory.percent
          }
        };

        // Calculate severity
        const severity = calculateSeverity(processData, trustedProcesses);
        processData.severity = severity;
        
        processes.push(processData);
      } catch (parseError) {
        console.error(`Error processing PID ${pid}:`, parseError);
        // Continue with other processes
      }
    }

    // Sort processes by PID for consistency
    processes.sort((a, b) => a.pid - b.pid);

    // Calculate additional statistics
    const stats = {
      totalCpuUsage: processes.reduce((sum, p) => sum + p.cpu, 0).toFixed(2),
      totalMemoryUsage: processes.reduce((sum, p) => sum + p.mem, 0).toFixed(2),
      highCpuProcesses: processes.filter(p => p.cpu > 10).length,
      highMemoryProcesses: processes.filter(p => p.mem > 5).length,
      rootProcesses: processes.filter(p => p.user === 'root').length
    };

    // Send comprehensive response
    res.status(200).json({
      systemInfo: systemInfo,
      processes: processes,
      totalProcesses: processes.length,
      scanTimestamp: new Date().toISOString(),
      statistics: stats,
      processCount: {
        total: processes.length,
        high: processes.filter(p => p.severity === 'High').length,
        medium: processes.filter(p => p.severity === 'Medium').length,
        low: processes.filter(p => p.severity === 'Low').length,
        trusted: processes.filter(p => p.severity === 'Trusted').length
      }
    });

  } catch (error) {
    console.error("Error in getProcesses:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.trustProcess = async (req, res) => {
  const { comm, args } = req.body;

  if (!comm) {
    return res.status(400).json({ message: "Command name is required" });
  }

  try {
    // Check if already trusted
    const existing = await prisma.trustedProcess.findFirst({
      where: { comm, args: args || '' }
    });

    if (existing) {
      return res.status(200).json({ message: "Process is already trusted" });
    }

    await prisma.trustedProcess.create({
      data: {
        comm,
        args: args || '',
      },
    });
    
    res.status(201).json({ message: "Process has been marked as trusted." });
  } catch (error) {
    console.error("Error trusting process:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

exports.killProcess = async (req, res) => {
  const { pid } = req.body;

  if (!pid) {
    return res.status(400).json({ message: "PID is required" });
  }

  // Validate PID is a number
  const pidNum = parseInt(pid);
  if (isNaN(pidNum) || pidNum <= 0) {
    return res.status(400).json({ message: "Invalid PID" });
  }

  // Don't allow killing critical system processes
  const criticalPids = [1, 2]; // init and kthreadd
  if (criticalPids.includes(pidNum)) {
    return res.status(403).json({ 
      message: "Cannot kill critical system process" 
    });
  }

  const command = os.platform() === 'win32' 
    ? `taskkill /PID ${pidNum} /F` 
    : `kill ${pidNum}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ 
        message: `Failed to kill process with PID ${pidNum}`,
        error: error.message
      });
    }
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    res.status(200).json({ 
      message: `Process with PID ${pidNum} has been terminated.`,
      pid: pidNum
    });
  });
};

// Optional: Add a separate endpoint for just system info
exports.getSystemInfo = async (req, res) => {
  try {
    const systemInfo = await getSystemInfo();
    res.status(200).json({
      systemInfo: systemInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting system info:", error);
    res.status(500).json({
      message: "Failed to retrieve system information",
      error: error.message,
    });
  }
};