import React, { useState, useEffect } from "react";
import { usePortScan } from "../context/PortScanContext";
import { 
  Scan, 
  RefreshCw, 
  AlertTriangle, 
  Server, 
  Shield, 
  Clock,
  Play,
  Pause,
  Settings,
  Zap
} from "lucide-react";

export default function PortScannerPanel({ shouldAutoStart = false, refreshTrigger = false }) {
  const { services, vulnerabilities, loading, error, scanAndCorrelate, clear } =
    usePortScan();
  const [target, setTarget] = useState("127.0.0.1");
  const [localServices, setLocalServices] = useState([]);
  const [localVulnerabilities, setLocalVulnerabilities] = useState([]);
  const [hasAutoScanned, setHasAutoScanned] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [lastAutoScan, setLastAutoScan] = useState(null);
  const [nextAutoScan, setNextAutoScan] = useState(null);

  // Update local state when context changes
  useEffect(() => {
    setLocalServices(services);
    setLocalVulnerabilities(vulnerabilities);
  }, [services, vulnerabilities]);

  // Auto-start scanning when shouldAutoStart becomes true
  useEffect(() => {
    if (shouldAutoStart && !hasAutoScanned && !loading) {
      console.log("Auto-starting port scan...");
      setHasAutoScanned(true);
      onScan();
    }
  }, [shouldAutoStart, hasAutoScanned, loading]);

  // Reset auto-scanned state when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      setHasAutoScanned(false);
    }
  }, [refreshTrigger]);

  // Auto-scan every 10 minutes when enabled
  useEffect(() => {
    let interval;
    
    if (autoScanEnabled && !loading) {
      // Calculate next scan time
      const calculateNextScan = () => {
        const now = new Date();
        const next = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
        setNextAutoScan(next);
        return next;
      };

      // Initial calculation
      calculateNextScan();

      // Set up interval
      interval = setInterval(async () => {
        console.log("🔄 Auto-scanning ports...");
        setLastAutoScan(new Date());
        await scanAndCorrelate({ target });
        calculateNextScan();
      }, 10 * 60 * 1000); // 10 minutes

      // Cleanup
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [autoScanEnabled, loading, target]);

  const onScan = async () => {
    console.log("Starting port scan for target:", target);
    await scanAndCorrelate({ target });
  };

  const handleClear = () => {
    setHasAutoScanned(false);
    clear();
  };

  const toggleAutoScan = () => {
    setAutoScanEnabled(!autoScanEnabled);
    if (!autoScanEnabled) {
      setLastAutoScan(new Date());
      const next = new Date(new Date().getTime() + 10 * 60 * 1000);
      setNextAutoScan(next);
    } else {
      setNextAutoScan(null);
    }
  };

  const formatTimeUntilNextScan = () => {
    if (!nextAutoScan) return "";
    const now = new Date();
    const diff = nextAutoScan - now;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="p-6 relative border border-white/10 rounded-xl text-white bg-gradient-to-br from-gray-900/50 to-blue-900/20 backdrop-blur-sm">
      {/* Header with improved design */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 mr-4 shadow-lg">
            <Server className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-white bg-clip-text text-transparent" style={{ fontFamily: "Libertinus Sans, serif" }}>
              Port & Service Scanner
            </h2>
            <p className="text-gray-300">
              Network port analysis and vulnerability detection
            </p>
          </div>
        </div>
        
        {/* Auto-scan status indicator */}
        <div className="flex items-center space-x-4">
          {autoScanEnabled && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">
                Auto-scan: {formatTimeUntilNextScan()}
              </span>
            </div>
          )}
          
          <button
            onClick={toggleAutoScan}
            className={`flex items-center px-4 py-2 rounded-lg border transition-all ${
              autoScanEnabled
                ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
            }`}
          >
            {autoScanEnabled ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Auto
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Auto Scan
              </>
            )}
          </button>
        </div>
      </div>

      {shouldAutoStart && !hasAutoScanned && (
        <div className="mb-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-3 rounded-lg flex items-center">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          <span>Auto-scan pending initial setup...</span>
        </div>
      )}

      {/* Scan Controls Card */}
      <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-300">
            Target (IP / CIDR):
          </label>
          {lastAutoScan && (
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              Last scan: {lastAutoScan.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="flex-1 bg-black/30 border border-white/20 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            placeholder="Enter IP address or hostname"
          />
          <div className="flex gap-2">
            <button
              onClick={onScan}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-cyan-500/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5 mr-2" />
                  Scan & Correlate
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-3 bg-gray-700/30 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-700/50 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Auto-scan info */}
        <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-cyan-400">
              <Settings className="w-4 h-4 mr-2" />
              Auto-scan: {autoScanEnabled ? "Enabled" : "Disabled"}
            </div>
            {autoScanEnabled && (
              <div className="text-gray-400">
                Scans every 10 minutes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-lg flex items-center backdrop-blur-sm">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="mb-6 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 px-4 py-3 rounded-lg flex items-center backdrop-blur-sm">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          <span>
            {hasAutoScanned ? "Auto-scanning ports..." : "Scanning in progress..."} 
            This may take a few minutes.
          </span>
        </div>
      )}

      {/* Services Section */}
      <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2 text-cyan-400" />
            Discovered Services 
            <span className="ml-2 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm border border-cyan-500/30">
              {localServices.length}
            </span>
          </h3>
          {hasAutoScanned && localServices.length > 0 && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/30">
              Auto-scanned
            </span>
          )}
        </div>

        {localServices.length === 0 ? (
          <div className="bg-black/20 p-8 rounded-lg text-center border-2 border-dashed border-white/10 hover:border-cyan-500/30 transition-all">
            <Server className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg mb-2">
              {loading ? "Scanning for services..." : "No services discovered"}
            </p>
            <p className="text-gray-500 text-sm">
              Run a scan to discover network services and open ports
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 shadow-lg">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-cyan-400 border-b border-white/10">
                    IP Address
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-cyan-400 border-b border-white/10">
                    Port/Protocol
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-cyan-400 border-b border-white/10">
                    Service Name
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-cyan-400 border-b border-white/10">
                    Product
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-cyan-400 border-b border-white/10">
                    Version
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-cyan-400 border-b border-white/10">
                    State
                  </th>
                </tr>
              </thead>
              <tbody>
                {localServices.map((s, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <td className="p-4 font-mono text-sm">{s.ip}</td>
                    <td className="p-4 font-mono text-sm">
                      {s.port}/{s.protocol}
                    </td>
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4 text-gray-300">{s.product || "-"}</td>
                    <td className="p-4 text-gray-300">{s.version || "-"}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          s.state === "open"
                            ? "bg-green-400/20 text-green-400 border-green-400/30"
                            : s.state === "closed"
                            ? "bg-red-400/20 text-red-400 border-red-400/30"
                            : "bg-gray-400/20 text-gray-400 border-gray-400/30"
                        }`}
                      >
                        {s.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vulnerabilities Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            Security Vulnerabilities
            <span className={`ml-2 px-2 py-1 rounded text-sm border ${
              localVulnerabilities.length > 0 
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : "bg-green-500/20 text-green-400 border-green-500/30"
            }`}>
              {localVulnerabilities.length}
            </span>
          </h3>
          {hasAutoScanned && localVulnerabilities.length > 0 && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/30">
              Auto-scanned
            </span>
          )}
        </div>

        {localVulnerabilities.length === 0 ? (
          <div className="bg-black/20 p-8 rounded-lg text-center border-2 border-dashed border-white/10 hover:border-green-500/30 transition-all">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg mb-2">
              {loading ? "Scanning for vulnerabilities..." : "No vulnerabilities found"}
            </p>
            <p className="text-gray-500 text-sm">
              Great! No known security vulnerabilities detected
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10 shadow-lg">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-red-400 border-b border-white/10">
                    CVE ID
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-red-400 border-b border-white/10">
                    Severity
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-red-400 border-b border-white/10">
                    Description
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-red-400 border-b border-white/10">
                    Service
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-red-400 border-b border-white/10">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {localVulnerabilities.map((v, i) => (
                  <tr
                    key={i}
                    className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <td className="p-4 border-t border-white/10 font-mono">
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${v.cveId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                      >
                        {v.cveId}
                      </a>
                    </td>
                    <td className="p-4 border-t border-white/10">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          v.severity === "HIGH" || v.severity === "CRITICAL"
                            ? "bg-red-400/20 text-red-400 border-red-400/30"
                            : v.severity === "MEDIUM"
                            ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                            : v.severity === "LOW"
                            ? "bg-green-400/20 text-green-400 border-green-400/30"
                            : "bg-gray-400/20 text-gray-400 border-gray-400/30"
                        }`}
                      >
                        {v.severity}
                      </span>
                    </td>
                    <td className="p-4 border-t border-white/10 max-w-md text-sm text-gray-300">
                      {v.description}
                    </td>
                    <td className="p-4 border-t border-white/10">
                      {v.service ? (
                        <div className="text-sm">
                          <div className="font-medium text-white">{v.service.name}</div>
                          <div className="text-gray-400 font-mono">
                            {v.service.ip}:{v.service.port}
                          </div>
                          {v.service.product && (
                            <div className="text-gray-500">
                              {v.service.product}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">Unknown service</span>
                      )}
                    </td>
                    <td className="p-4 border-t border-white/10">
                      <span
                        className={`px-2 py-1 rounded text-xs border ${
                          v.source === "NVD"
                            ? "bg-blue-400/20 text-blue-400 border-blue-400/30"
                            : v.source === "HARDCODED"
                            ? "bg-purple-400/20 text-purple-400 border-purple-400/30"
                            : "bg-gray-400/20 text-gray-400 border-gray-400/30"
                        }`}
                      >
                        {v.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Debug information - only show in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/10">
          <h4 className="font-semibold mb-2 text-gray-300">
            Debug Information:
          </h4>
          <div className="text-sm text-gray-400 grid grid-cols-2 gap-2">
            <p>Services count: {localServices.length}</p>
            <p>Vulnerabilities count: {localVulnerabilities.length}</p>
            <p>Loading: {loading ? "Yes" : "No"}</p>
            <p>Error: {error || "None"}</p>
            <p>Auto-start: {shouldAutoStart ? "Yes" : "No"}</p>
            <p>Has auto-scanned: {hasAutoScanned ? "Yes" : "No"}</p>
            <p>Refresh trigger: {refreshTrigger ? "Yes" : "No"}</p>
            <p>Auto-scan enabled: {autoScanEnabled ? "Yes" : "No"}</p>
            <p>Last auto-scan: {lastAutoScan ? lastAutoScan.toLocaleTimeString() : "Never"}</p>
            <p>Next auto-scan: {nextAutoScan ? formatTimeUntilNextScan() : "Not scheduled"}</p>
          </div>
        </div>
      )}
    </div>
  );
}