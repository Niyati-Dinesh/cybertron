const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require('fs');      // <-- Add this import
const path = require('path');  // <-- Add this import
const os = require('os');      // <-- Add this import

const execAsync = promisify(exec);

// ... (The parsePaths and checkWorldWritableBinaries functions are unchanged)

const parsePaths = (stdout) => {
  if (!stdout) return [];
  return stdout.trim().split('\n').filter(line => line.length > 0);
};

async function checkWorldWritableBinaries() {
  const command = `for dir in $(echo $PATH | tr ':' ' '); do find "$dir" -type f -perm -002 -printf '%p\\n' 2>/dev/null; done`;
  const { stdout } = await execAsync(command);
  console.log("✅ Checked for world-writable binaries.");
  return parsePaths(stdout);
}


// --- THIS FUNCTION IS UPDATED ---
/**
 * 2. Checks for suspicious executables in common staging directories.
 */
async function checkSuspiciousExecutables() {
  const dirsToScan = ['/tmp'];
  const downloadsDir = path.join(os.homedir(), 'Downloads');

  // ✅ Safely check if the Downloads directory exists before adding it
  if (fs.existsSync(downloadsDir)) {
    dirsToScan.push(downloadsDir);
  }

  // Dynamically build the command with only the directories that exist
  const command = `find ${dirsToScan.join(' ')} -type f -executable -printf '%p\\n' 2>/dev/null`;
  
  const { stdout } = await execAsync(command);
  console.log("✅ Checked for suspicious executables.");
  return parsePaths(stdout);
}

// ... (The checkDiskUsage and runHygieneScan functions are unchanged)

async function checkDiskUsage() {
  const command = `du -h /var /home 2>/dev/null | sort -rh | head -n 5`;
  const { stdout } = await execAsync(command);
  if (!stdout) return [];
  const lines = stdout.trim().split('\n').filter(line => line.length > 0);
  const parsed = lines.map(line => {
    const parts = line.trim().split(/\s+/);
    const size = parts[0];
    const path = parts.slice(1).join(' ');
    return { size, path };
  });
  console.log("✅ Checked disk usage.");
  return parsed;
}

exports.runHygieneScan = async (req, res) => {
  console.log("🚀 Starting file-system hygiene scan...");
  try {
    const [worldWritableBinaries, suspiciousExecutables, diskUsageTop] = await Promise.all([
      checkWorldWritableBinaries(),
      checkSuspiciousExecutables(),
      checkDiskUsage(),
    ]);
    const recommendations = [];
    if (worldWritableBinaries.length > 0) {
      recommendations.push("High Risk: Restrict permissions on world-writable binaries to prevent tampering. Use 'chmod o-w <file>'.");
    }
    if (suspiciousExecutables.length > 0) {
      recommendations.push("Warning: Review executables in /tmp or Downloads. If they are legitimate, move them to a standard application directory.");
    }
    if (diskUsageTop.length > 0) {
      recommendations.push("Info: Investigate large directories under /var or /home to free up disk space. Check for runaway log files or old user data.");
    }
    const result = {
      scanTimestamp: new Date().toISOString(),
      worldWritableBinaries,
      suspiciousExecutables,
      diskUsageTop,
      recommendations,
    };
    console.log("✅ Hygiene scan completed successfully.");
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Hygiene scan failed:", error);
    res.status(500).json({
      message: "An error occurred during the file-system scan.",
      error: error.message,
    });
  }
};