import { useContext, useState, useEffect } from "react";
import {
  Shield,
  Activity,
  Network,
  Wifi,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Zap,
  Monitor,
  HardDrive,
  BarChart,
  Cpu,
  Lock,
  Users,
  Server,
  Eye,
  FileText,
  Scan
} from "lucide-react";
import { ScanContext } from "../context/ScanContext";
import ProcessTable from "./ProcessTable";
import PortScannerPanel from "./PortScannerPanel";
import HygieneScanner from "./HygieneScanner";
import NetworkScanner from "./NetworkScanner";

const Dashboard = () => {
  const {
    processData,
    systemInfo,
    fetchProcesses,
    loading,
    backgroundLoading,
    scanTimestamp,
    getSystemStats,
  } = useContext(ScanContext);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasInitialScan, setHasInitialScan] = useState(
    sessionStorage.getItem("hasInitialScan") === "true"
  );
  const [shouldStartPortScanning, setShouldStartPortScanning] = useState(false);
  const [isRefreshingAllModules, setIsRefreshingAllModules] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (processData.length > 0 && !hasInitialScan) {
      setHasInitialScan(true);
      sessionStorage.setItem("hasInitialScan", "true");
    }
  }, [processData, hasInitialScan]);

  const handleInitialScan = async () => {
    await fetchProcesses(true);
    setShouldStartPortScanning(true);
  };

  const handleRefreshAllModules = async () => {
    setIsRefreshingAllModules(true);
    try {
      await fetchProcesses(true);
      setShouldStartPortScanning((prev) => !prev);
    } finally {
      setIsRefreshingAllModules(false);
    }
  };

  const systemStats = getSystemStats();

  const formatMemory = (bytes) => {
    if (!bytes) return null;
    const gb = (bytes / 1024 / 1024 / 1024).toFixed(1);
    return `${gb} GB`;
  };

  const getOSDisplayName = () => {
    if (!systemInfo) return "System";
    if (systemInfo.platform === "linux") {
      if (systemInfo.osRelease?.toLowerCase().includes("kali")) return "Kali Linux";
      if (systemInfo.version?.toLowerCase().includes("ubuntu")) return "Ubuntu Linux";
      if (systemInfo.version?.toLowerCase().includes("debian")) return "Debian Linux";
      return "Linux";
    }
    return systemInfo.platform
      ? `${systemInfo.platform.charAt(0).toUpperCase()}${systemInfo.platform.slice(1)}`
      : "System";
  };

  // --- ENHANCED START MONITORING PAGE ---
  if (!hasInitialScan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="min-h-screen pt-20 pb-8 px-6 w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Shield className="w-16 h-16 text-cyan-400 relative z-10" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 font-serif bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Security Dashboard
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive security monitoring platform designed to protect your system 
              with real-time threat detection and advanced analytics.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">System Health</h3>
              <p className="text-gray-400 text-sm">
                Monitor CPU, memory, and process performance in real-time
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <Network className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Network Security</h3>
              <p className="text-gray-400 text-sm">
                Scan ports and detect unauthorized network activities
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/8 transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Threat Detection</h3>
              <p className="text-gray-400 text-sm">
                Identify suspicious processes and potential security risks
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 font-serif">What You'll Monitor</h2>
              
              <div className="space-y-4">
                {[
                  { icon: Activity, text: "Real-time process monitoring and analysis", color: "cyan" },
                  { icon: Eye, text: "Suspicious activity detection and alerts", color: "red" },
                  { icon: Network, text: "Open port scanning and network mapping", color: "green" },
                  { icon: Users, text: "Device discovery and tracking", color: "blue" },
                  { icon: FileText, text: "File integrity and permission checks", color: "purple" },
                  { icon: HardDrive, text: "System resource utilization tracking", color: "orange" },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4 group">
                    <div className={`flex-shrink-0 w-10 h-10 bg-${feature.color}-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 font-serif">Security Benefits</h2>
              
              <div className="space-y-4">
                {[
                  "Threat detection and prevention",
                  "Comprehensive system visibility",
                  "Real-time security alerts",
                  "Network vulnerability assessment",
                  "Process behavior analysis",
                  "Automated security reporting"
                  
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Info & Scan Button */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Scan className="w-8 h-8 text-cyan-400" />
                <h3 className="text-2xl font-bold text-white font-serif">Ready to Secure Your System</h3>
              </div>
              
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Initial scan will analyze your system processes, network configuration, 
                and security posture to establish baseline monitoring.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm">
                <div className="text-left bg-black/20 rounded-lg p-4">
                  <h4 className="text-cyan-400 font-semibold mb-2">Scan Includes:</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Process inventory & analysis</li>
                    <li>• Network port scanning</li>
                    <li>• System resource audit</li>
                    
                  </ul>
                </div>
                <div className="text-left bg-black/20 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold mb-2">Estimated Time:</h4>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Initial scan: 15-30 seconds</li>
                    <li>• Real-time updates: Continuous</li>
                    <li>• Threat analysis: Instant</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={handleInitialScan}
                disabled={loading || backgroundLoading}
                className={`relative px-16 py-6 rounded-2xl font-bold text-xl transition-all duration-500 transform border-2 ${
                  loading || backgroundLoading
                    ? "bg-gray-600/20 text-gray-400 cursor-not-allowed border-gray-500/20"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:scale-105"
                }`}
              >
                {loading || backgroundLoading ? (
                  <div className="flex items-center justify-center space-x-4">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Initializing Security Scan...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-4">
                    <Zap className="w-6 h-6" />
                    <span>Start Security Scan</span>
                  </div>
                )}
              </button>

              <p className="text-gray-400 text-sm mt-4">
                This action will start monitoring your system in real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- NORMAL DASHBOARD (after initial scan) ---
  return (
    <div className="min-h-screen pt-20 pb-8 px-6 bg-transparent" style={{ fontFamily: "Open Sans, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        {/* ... rest of your existing dashboard code ... */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight" style={{ fontFamily: "Libertinus Sans, serif" }}>
                {getOSDisplayName()}
              </h1>
              <div className="space-y-3 text-lg text-gray-300">
                {systemInfo && (
                  <>
                    <div className="flex items-center justify-center lg:justify-start space-x-2">
                      <Monitor className="w-5 h-5 text-cyan-400" />
                      <span>{systemInfo.arch} architecture</span>
                    </div>
                    
                  </>
                )}
                <div className="flex items-center justify-center lg:justify-start space-x-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>{currentTime.toLocaleString()}</span>
                </div>
                {scanTimestamp && (
                  <div className="flex items-center justify-center lg:justify-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Last scan: {new Date(scanTimestamp).toLocaleTimeString()}</span>
                  </div>
                )}
                {!backgroundLoading && (
                  <div className="flex items-center justify-center lg:justify-start space-x-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <span>{processData.length} processes monitored</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {(loading || isRefreshingAllModules) && (
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-cyan-400 text-sm font-medium">Refreshing All Modules</span>
                  </div>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={handleRefreshAllModules}
                  disabled={loading || isRefreshingAllModules}
                  className={`cursor-pointer relative px-16 py-8 rounded-3xl font-bold text-2xl transition-all duration-500 transform border-2 ${
                    loading || isRefreshingAllModules
                      ? "bg-gray-600/20 text-gray-400 cursor-not-allowed border-gray-500/20"
                      : "bg-transparent text-white border-white/30 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105"
                  }`}
                >
                  {loading || isRefreshingAllModules ? (
                    <div className="flex items-center space-x-4">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <span>Scanning...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <Zap className="w-8 h-8" />
                      <span>Refresh Scan</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Modules */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "Libertinus Sans, serif" }}>
              Security Modules
            </h2>
            <p className="text-gray-400 text-lg">Active monitoring and analysis tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center hover:bg-white/8 transition-all duration-300">
              <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 inline-flex mb-4">
                <Activity className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Process Monitor</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">Real-time process analysis and threat detection</p>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Active</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center hover:bg-white/8 transition-all duration-300">
              <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 inline-flex mb-4">
                <Network className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Port Scanner</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">Network port analysis and vulnerability detection</p>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Active</span>
              </div>
            </div>

            {[
              { icon: Wifi, title: "Device Discovery", desc: "Network device mapping and identification" },
              { icon: AlertTriangle, title: "File System Hygiene", desc: "Hygiene report on file directories" },
            ].map((module, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center opacity-60">
                <div className="p-3 rounded-xl bg-gray-500/10 border border-gray-500/20 inline-flex mb-4">
                  <module.icon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{module.title}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{module.desc}</p>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Coming Soon</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8 backdrop-blur-sm">
          <ProcessTable disableAutoRefresh={false} />
        </div>

        <div className="space-y-8 bg-transparent backdrop-blur-sm mt-5">
          <PortScannerPanel
            shouldAutoStart={shouldStartPortScanning}
            refreshTrigger={isRefreshingAllModules}
          />
        </div>

        <div className="space-y-8 bg-transparent backdrop-blur-sm">
          <HygieneScanner />
        </div>

        <div className="space-y-8 bg-transparent backdrop-blur-sm">
          <NetworkScanner />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;