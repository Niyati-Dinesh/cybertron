const { exec } = require("child_process");
const { PrismaClient } = require("../generated/prisma");
const os = require("os");
const { promisify } = require("util");

const execAsync = promisify(exec);
const prisma = new PrismaClient();

/**
 * Helper: Collect system information
 */
const getSystemInfo = async () => {
  try {
    const platform = os.platform();
    const systemInfo = {
      hostname: os.hostname(),
      platform,
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)), // GB
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)), // GB
      uptime: Math.round(os.uptime() / 3600), // hours
      nodeVersion: process.version,
    };

    if (platform === "linux" || platform === "darwin") {
      try {
        const { stdout } = await execAsync(
          'cat /etc/os-release 2>/dev/null || sw_vers 2>/dev/null || echo "OS_INFO_NOT_AVAILABLE"'
        );
        systemInfo.osRelease = stdout.trim();
      } catch {
        systemInfo.osRelease = "Not available";
      }

      try {
        const { stdout } = await execAsync("uname -r");
        systemInfo.kernelVersion = stdout.trim();
      } catch {
        systemInfo.kernelVersion = "Not available";
      }

      try {
        const { stdout } = await execAsync("uname -s -r -v");
        systemInfo.osVersion = stdout.trim();
      } catch {
        systemInfo.osVersion = "Not available";
      }
    } else if (platform === "win32") {
      try {
        const { stdout } = await execAsync("ver");
        systemInfo.osVersion = stdout.trim();
      } catch {
        systemInfo.osVersion = "Not available";
      }

      try {
        const { stdout } = await execAsync(
          'systeminfo | findstr /B /C:"OS Name" /C:"OS Version"'
        );
        systemInfo.osRelease = stdout.trim();
      } catch {
        systemInfo.osRelease = "Not available";
      }

      systemInfo.kernelVersion = "N/A (Windows)";
    }

    if (platform !== "win32") {
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

/**
 * Helper: Assign severity level to a process
 */
const calculateSeverity = (processData, trustedProcesses) => {
  const { comm, args, user, cpu, mem } = processData;

  // Check trusted processes
  const isTrusted = trustedProcesses.some(
    (p) => p.comm === comm && p.args === args
  );
  if (isTrusted) return "Trusted";

  let severity = "Low";

  // Rule 1: Suspicious execution locations
  if (
    args.includes("/tmp/") ||
    args.includes("/Downloads/") ||
    args.includes("/var/tmp/") ||
    args.includes("\\temp\\") ||
    args.includes("\\Downloads\\")
  ) {
    severity = "High";
  }

  // Rule 2: High CPU/Memory
  if (cpu > 80.0 || mem > 60.0) {
    if (severity === "Low") severity = "Medium";
  }

  // Rule 3: Suspicious root process
  if (
    user === "root" &&
    (args.includes("/home/") || args.includes("/root/") || args.includes("~/"))
  ) {
    if (severity === "Low") severity = "Medium";
  }

  // Rule 4: Suspicious file execution
  if (
    args.includes("/tmp/") &&
    [".sh", ".exe", ".py", ".pl", ".rb"].some((ext) => args.includes(ext))
  ) {
    if (severity === "Low") severity = "High";
  }

  // Rule 5: Weird command names
  if (
    comm.includes("..") ||
    comm.includes("/") ||
    comm.length === 1 ||
    /^[0-9]+$/.test(comm)
  ) {
    if (severity === "Low") severity = "Medium";
  }

  return severity;
};

/**
 * Controller: Get process list + system info
 */
exports.getProcesses = async (req, res) => {
  try {
    const systemInfo = await getSystemInfo();
    const trustedProcesses = await prisma.trustedProcess.findMany();

    const commands = {
      basic: "ps -eo pid,comm,user,etime --no-headers",
      cpu: "ps -eo pid,%cpu --no-headers",
      memory: "ps -eo pid,%mem,vsz,rss --no-headers",
      args: "ps -eo pid,args --no-headers",
    };

    const [basicResult, cpuResult, memoryResult, argsResult] = await Promise.all(
      [
        execAsync(commands.basic),
        execAsync(commands.cpu),
        execAsync(commands.memory),
        execAsync(commands.args),
      ]
    );

    const basicMap = new Map();
    const cpuMap = new Map();
    const memoryMap = new Map();
    const argsMap = new Map();

    // Parse basic info
    basicResult.stdout
      .trim()
      .split("\n")
      .forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const pid = parseInt(parts[0]);
          basicMap.set(pid, {
            pid,
            comm: parts[1],
            user: parts[2],
            etime: parts[3],
          });
        }
      });

    // Parse CPU info
    cpuResult.stdout
      .trim()
      .split("\n")
      .forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          cpuMap.set(parseInt(parts[0]), parseFloat(parts[1]) || 0.0);
        }
      });

    // Parse memory info
    memoryResult.stdout
      .trim()
      .split("\n")
      .forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          memoryMap.set(parseInt(parts[0]), {
            percent: parseFloat(parts[1]) || 0.0,
            vsz: parseInt(parts[2]) || 0,
            rss: parseInt(parts[3]) || 0,
          });
        }
      });

    // Parse args
    argsResult.stdout
      .trim()
      .split("\n")
      .forEach((line) => {
        const spaceIndex = line.indexOf(" ");
        if (spaceIndex !== -1) {
          const pid = parseInt(line.substring(0, spaceIndex));
          const args = line.substring(spaceIndex + 1).trim();
          argsMap.set(pid, args);
        }
      });

    // Combine data
    const processes = [];
    for (const [pid, basicInfo] of basicMap) {
      try {
        const cpu = cpuMap.get(pid) || 0.0;
        const memory = memoryMap.get(pid) || { percent: 0.0, vsz: 0, rss: 0 };
        const args = argsMap.get(pid) || basicInfo.comm;

        const processData = {
          pid,
          comm: basicInfo.comm,
          cpu,
          mem: memory.percent,
          user: basicInfo.user,
          etime: basicInfo.etime,
          args,
          memoryDetails: {
            virtualSize: Math.round(memory.vsz / 1024), // MB
            residentSize: Math.round(memory.rss / 1024), // MB
            percent: memory.percent,
          },
        };

        processData.severity = calculateSeverity(processData, trustedProcesses);
        processes.push(processData);
      } catch (err) {
        console.error(`Error processing PID ${pid}:`, err);
      }
    }

    processes.sort((a, b) => a.pid - b.pid);

    const stats = {
      totalCpuUsage: Number(
        processes.reduce((sum, p) => sum + p.cpu, 0).toFixed(2)
      ),
      totalMemoryUsage: Number(
        processes.reduce((sum, p) => sum + p.mem, 0).toFixed(2)
      ),
      highCpuProcesses: processes.filter((p) => p.cpu > 10).length,
      highMemoryProcesses: processes.filter((p) => p.mem > 5).length,
      rootProcesses: processes.filter((p) => p.user === "root").length,
    };

    res.status(200).json({
      systemInfo,
      processes,
      totalProcesses: processes.length,
      scanTimestamp: new Date().toISOString(),
      statistics: stats,
      processCount: {
        total: processes.length,
        high: processes.filter((p) => p.severity === "High").length,
        medium: processes.filter((p) => p.severity === "Medium").length,
        low: processes.filter((p) => p.severity === "Low").length,
        trusted: processes.filter((p) => p.severity === "Trusted").length,
      },
    });
  } catch (error) {
    console.error("Error in getProcesses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Controller: Trust a process
 */
exports.trustProcess = async (req, res) => {
  const { comm, args } = req.body;
  if (!comm) return res.status(400).json({ message: "Command name is required" });

  try {
    const existing = await prisma.trustedProcess.findFirst({
      where: { comm, args: args || "" },
    });

    if (existing)
      return res.status(200).json({ message: "Process is already trusted" });

    await prisma.trustedProcess.create({
      data: { comm, args: args || "" },
    });

    res.status(201).json({ message: "Process has been marked as trusted." });
  } catch (error) {
    console.error("Error trusting process:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Controller: Kill a process
 */
exports.killProcess = async (req, res) => {
  const { pid } = req.body;
  if (!pid) return res.status(400).json({ message: "PID is required" });

  const pidNum = parseInt(pid);
  if (isNaN(pidNum) || pidNum <= 0)
    return res.status(400).json({ message: "Invalid PID" });

  const criticalPids = [1, 2]; // Protect init/kthreadd
  if (criticalPids.includes(pidNum))
    return res
      .status(403)
      .json({ message: "Cannot kill critical system process" });

  const command =
    os.platform() === "win32"
      ? `taskkill /PID ${pidNum} /F`
      : `kill ${pidNum}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({
        message: `Failed to kill process with PID ${pidNum}`,
        error: error.message,
      });
    }
    if (stderr) console.error(`stderr: ${stderr}`);

    res
      .status(200)
      .json({ message: `Process with PID ${pidNum} has been terminated.`, pid: pidNum });
  });
};

/**
 * Controller: Get system info only
 */
exports.getSystemInfo = async (req, res) => {
  try {
    const systemInfo = await getSystemInfo();
    res.status(200).json({ systemInfo, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Error getting system info:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve system information", error: error.message });
  }
};
