import React, { createContext, useState } from 'react';
import axios from 'axios';

export const ScanContext = createContext();

export const ScanProvider = ({ children }) => {
  const [processData, setProcessData] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [scanTimestamp, setScanTimestamp] = useState(null);
  const [totalProcesses, setTotalProcesses] = useState(0);
  const [loading, setLoading] = useState(false); // Only for manual scans
  const [backgroundLoading, setBackgroundLoading] = useState(false); // For auto-refresh
  const [systemInfoLoading, setSystemInfoLoading] = useState(false); // For system info only
  const [error, setError] = useState('');

  // Helper function to get auth token
  const getAuthToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setError('Not authenticated.');
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
    setError('');

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setBackgroundLoading(false);
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/api/routes/scan/processes', {
        headers: {
          authtoken: token
        }
      });

      // Handle the new response structure with system info
      const { systemInfo: sysInfo, processes, totalProcesses: total, scanTimestamp: timestamp } = response.data;
      
      setProcessData(processes || response.data); // Fallback for old response format
      setSystemInfo(sysInfo);
      setScanTimestamp(timestamp);
      setTotalProcesses(total || processes?.length || 0);
      
    } catch (err) {
      // Only show error for manual fetches, not background ones
      if (showLoading) {
        setError('Failed to fetch process data.');
      }
      console.error('Fetch processes error:', err.response?.data || err.message);
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
    setError('');

    const token = getAuthToken();
    if (!token) {
      setSystemInfoLoading(false);
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/api/routes/scan/system-info', {
        headers: {
          authtoken: token
        }
      });

      const { systemInfo: sysInfo, timestamp } = response.data;
      setSystemInfo(sysInfo);
      setScanTimestamp(timestamp);
      
    } catch (err) {
      console.error('Fetch system info error:', err.response?.data || err.message);
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
      await axios.post('http://localhost:5000/api/routes/scan/trust-process', 
        { comm, args },
        {
          headers: {
            authtoken: token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh process data after trusting
      backgroundFetchProcesses();
      return true;
    } catch (err) {
      console.error('Trust process error:', err.response?.data || err.message);
      setError('Failed to trust process.');
      return false;
    }
  };

  // Kill a process
  const killProcess = async (pid) => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      await axios.post('http://localhost:5000/api/routes/scan/kill-process', 
        { pid },
        {
          headers: {
            authtoken: token,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh process data after killing
      backgroundFetchProcesses();
      return true;
    } catch (err) {
      console.error('Kill process error:', err.response?.data || err.message);
      setError('Failed to kill process.');
      return false;
    }
  };

  // Clear error
  const clearError = () => {
    setError('');
  };

  // Get processes by severity
  const getProcessesBySeverity = (severity) => {
    return processData.filter(process => process.severity === severity);
  };

  // Get system stats
  const getSystemStats = () => {
    if (!systemInfo) return null;
    
    return {
      memoryUsage: systemInfo.totalMemory ? 
        ((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory * 100).toFixed(1) : 0,
      uptime: systemInfo.uptime || 0,
      loadAverage: systemInfo.loadAverage || null,
      processCount: totalProcesses
    };
  };

  const contextValue = {
    // Data
    processData,
    systemInfo,
    scanTimestamp,
    totalProcesses,
    
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
  };

  return (
    <ScanContext.Provider value={contextValue}>
      {children}
    </ScanContext.Provider>
  );
};