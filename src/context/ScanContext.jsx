import React, { createContext, useState } from "react";
import axios from "axios";

export const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [processData, setProcessData] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [scanTimestamp, setScanTimestamp] = useState(null);
  const [totalProcesses, setTotalProcesses] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [processCount, setProcessCount] = useState(null);
  const [loading, setLoading] = useState(false); // Only for manual scans
  const [backgroundLoading, setBackgroundLoading] = useState(false); // For auto-refresh
  const [systemInfoLoading, setSystemInfoLoading] = useState(false); // For system info only
  const [error, setError] = useState("");

  // Helper function to validate and sanitize process data
  const sanitizeProcessData = (processes) => {
    if (!Array.isArray(processes)) {
      console.error(
        "Expected processes to be an array, got:",
        typeof processes
      );
      return [];
    }

    return processes.map((process) => ({
      pid: process.pid || 0,
      comm: process.comm || "unknown",
      cpu: (parseFloat(process.cpu) || 0).toFixed(1),
      mem: (parseFloat(process.mem) || 0).toFixed(1),
      user: process.user || "unknown",
      etime: process.etime || "00:00",
      args: process.args || "",
      severity: process.severity || "Low",
      // Add new memory details if available
      memoryDetails: process.memoryDetails || {
        virtualSize: 0,
        residentSize: 0,
        percent: parseFloat(process.mem) || 0,
      },
    }));
  };

  // Helper function to get auth token
  const getAuthToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      setError("Not authenticated.");
      return null;
    }
    return token;
  };

  // Manual fetch - shows loading spinner
  const fetchProcesses = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setBackgroundLoading(true);
    }
    setError("");

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setBackgroundLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:5000/api/routes/scan/processes",
        {
          headers: {
            authtoken: token,
          },
        }
      );

      // Handle the enhanced response structure
      const {
        systemInfo: sysInfo,
        processes,
        totalProcesses: total,
        scanTimestamp: timestamp,
        statistics: stats,
        processCount: pCount,
      } = response.data;

      // Validate and sanitize the data
      const sanitizedProcesses = sanitizeProcessData(
        processes || response.data
      );

      setProcessData(sanitizedProcesses);
      setSystemInfo(sysInfo);
      setScanTimestamp(timestamp);
      setTotalProcesses(total || sanitizedProcesses.length || 0);
      setStatistics(stats);
      setProcessCount(pCount);

      console.log(`Loaded ${sanitizedProcesses.length} processes`);
      console.log("Statistics:", stats);
      console.log("Process Count by Severity:", pCount);
    } catch (err) {
      console.error(
        "Fetch processes error:",
        err.response?.data || err.message
      );
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch processes";

      // Only show error for manual fetches, not background ones
      if (showLoading) {
        setError(errorMessage);
      }

      // Don't clear existing data on background fetch errors
      if (showLoading && processData.length === 0) {
        setProcessData([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setBackgroundLoading(false);
      }
    }
  };

  // Fetch only system information
  const fetchSystemInfo = async () => {
    setSystemInfoLoading(true);
    setError("");

    const token = getAuthToken();
    if (!token) {
      setSystemInfoLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:5000/api/routes/scan/system-info",
        {
          headers: {
            authtoken: token,
          },
        }
      );

      const { systemInfo: sysInfo, timestamp } = response.data;
      setSystemInfo(sysInfo);
      setScanTimestamp(timestamp);
    } catch (err) {
      console.error(
        "Fetch system info error:",
        err.response?.data || err.message
      );
      // Don't set error for system info fetch as it's not critical
    } finally {
      setSystemInfoLoading(false);
    }
  };

  // Background fetch - no loading spinner, silent refresh
  const backgroundFetchProcesses = () => {
    fetchProcesses(false);
  };

  // Trust a process
  const trustProcess = async (comm, args) => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      await axios.post(
        "http://localhost:5000/api/routes/scan/trust-process",
        { comm, args },
        {
          headers: {
            authtoken: token,
            "Content-Type": "application/json",
          },
        }
      );

      // Refresh process data after trusting
      backgroundFetchProcesses();
      return true;
    } catch (err) {
      console.error("Trust process error:", err.response?.data || err.message);
      setError("Failed to trust process.");
      return false;
    }
  };

  // Kill a process
  const killProcess = async (pid) => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      await axios.post(
        "http://localhost:5000/api/routes/scan/kill-process",
        { pid },
        {
          headers: {
            authtoken: token,
            "Content-Type": "application/json",
          },
        }
      );

      // Refresh process data after killing
      backgroundFetchProcesses();
      return true;
    } catch (err) {
      console.error("Kill process error:", err.response?.data || err.message);
      setError("Failed to kill process.");
      return false;
    }
  };

  // Clear error
  const clearError = () => {
    setError("");
  };

  // Get processes by severity
  const getProcessesBySeverity = (severity) => {
    return processData.filter((process) => process.severity === severity);
  };

  // Get enhanced system stats using both systemInfo and statistics
  const getSystemStats = () => {
    if (!systemInfo) return null;

    const baseStats = {
      memoryUsage: systemInfo.totalMemory
        ? (
            ((systemInfo.totalMemory - systemInfo.freeMemory) /
              systemInfo.totalMemory) *
            100
          ).toFixed(1)
        : 0,
      uptime: systemInfo.uptime || 0,
      loadAverage: systemInfo.loadAverage || null,
      processCount: totalProcesses,
    };

    // Add statistics if available
    if (statistics) {
      return {
        ...baseStats,
        totalCpuUsage: statistics.totalCpuUsage,
        totalMemoryUsage: statistics.totalMemoryUsage,
        highCpuProcesses: statistics.highCpuProcesses,
        highMemoryProcesses: statistics.highMemoryProcesses,
        rootProcesses: statistics.rootProcesses,
      };
    }

    return baseStats;
  };

  // Get process count by severity (using server data if available)
  const getProcessCountBySeverity = () => {
    if (processCount) {
      return processCount;
    }

    // Fallback to client-side calculation
    return {
      total: processData.length,
      high: processData.filter((p) => p.severity === "High").length,
      medium: processData.filter((p) => p.severity === "Medium").length,
      low: processData.filter((p) => p.severity === "Low").length,
      trusted: processData.filter((p) => p.severity === "Trusted").length,
    };
  };

  const contextValue = {
    // Data
    processData,
    systemInfo,
    scanTimestamp,
    totalProcesses,
    statistics,
    processCount,

    // Loading states
    loading, // Only true for manual scans
    backgroundLoading, // True for auto-refresh
    systemInfoLoading, // True for system info fetch
    error,

    // Functions
    fetchProcesses, // Manual fetch with loading
    backgroundFetchProcesses, // Silent background fetch
    fetchSystemInfo, // Fetch only system info
    trustProcess, // Trust a process
    killProcess, // Kill a process
    clearError, // Clear error state

    // Helper functions
    getProcessesBySeverity, // Get filtered processes
    getSystemStats, // Get computed system statistics
    getProcessCountBySeverity, // Get process count by severity
  };

  return (
    <ScanContext.Provider value={contextValue}>{children}</ScanContext.Provider>
  );
};
