import { useState, useEffect } from "react";
import {
  Activity,
  Network,
  Wifi,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  BarChart,
  Cpu,
  Lock,
  XCircle,
} from "lucide-react";

const Dashboard = () => {
  // States
  const [hasInitialScan, setHasInitialScan] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shouldStartPortScanning, setShouldStartPortScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);

  // Dummy system stats
  const getSystemStats = () => ({
    uptime: 123456, // seconds
    memory: 8589934592, // bytes (8GB)
  });

  // Simulate process fetching
  const fetchProcesses = async () => {
    console.log("Fetching processes...");
    return new Promise((resolve) => setTimeout(resolve, 2000));
  };

  // Timer for live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Start scan handler
  const handleInitialScan = async () => {
    setLoading(true);
    await fetchProcesses(true);
    setShouldStartPortScanning(true);
    setLoading(false);
    setHasInitialScan(true);
  };

  // Format helpers
  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes) => {
    if (!bytes) return null;
    const gb = (bytes / 1024 / 1024 / 1024).toFixed(1);
    return `${gb} GB`;
  };

  const systemStats = getSystemStats();

  // --- BEFORE FIRST SCAN ---
  if (!hasInitialScan) {
    return (
      <div
        className="min-h-screen pt-20 pb-8 px-6 bg-transparent"
        style={{ fontFamily: "Open Sans, sans-serif" }}
      >
        {/* Intro Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to Security Dashboard
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-10 mx-auto">
            Your system's first line of defense. Start monitoring now to analyze
            running processes, detect potential threats, and keep your machine
            safe in real time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <Cpu className="w-10 h-10 text-cyan-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">
                Process Scanning
              </h3>
              <p className="text-gray-400 text-sm">
                Identify suspicious processes and stop them instantly.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <BarChart className="w-10 h-10 text-green-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">
                Resource Insights
              </h3>
              <p className="text-gray-400 text-sm">
                Track CPU, memory, and system load in real time.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <Lock className="w-10 h-10 text-purple-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">
                Network Awareness
              </h3>
              <p className="text-gray-400 text-sm">
                Monitor ports and detect unauthorized devices on your LAN.
              </p>
            </div>
          </div>

          <button
            onClick={handleInitialScan}
            disabled={loading || backgroundLoading}
            className={`cursor-pointer px-12 py-6 rounded-3xl font-bold text-2xl transition-all duration-500 transform border-2 ${
              loading || backgroundLoading
                ? "bg-gray-600/20 text-gray-400 cursor-not-allowed border-gray-500/20"
                : "bg-transparent text-white border-white/30 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105"
            }`}
          >
            {loading || backgroundLoading ? (
              <div className="flex items-center space-x-4">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span>Initializing Security Modules...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Zap className="w-8 h-8" />
                <span>Start Monitoring</span>
              </div>
            )}
          </button>
        </div>

        
        <div className="mb-16 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Security Modules
            </h2>
            <p className="text-gray-400 text-lg">
              Active monitoring and analysis tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Activity, name: "Process Monitor" },
              { icon: Network, name: "Port Scanner" },
              { icon: Wifi, name: "Device Discovery" },
              { icon: AlertTriangle, name: "Threat Analysis" },
            ].map((m, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center opacity-60"
              >
                <div className="p-3 rounded-xl bg-gray-500/10 border border-gray-500/20 inline-flex mb-4">
                  <m.icon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {m.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Inactive
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm font-medium">
                    Inactive
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- AFTER FIRST SCAN ---
  return (
    <div
      className="min-h-screen pt-20 pb-8 px-6 bg-transparent"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Security Modules
            </h2>
            <p className="text-gray-400 text-lg">
              Active monitoring and analysis tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Activity, name: "Process Monitor" },
              { icon: Network, name: "Port Scanner" },
              { icon: Wifi, name: "Device Discovery" },
              { icon: AlertTriangle, name: "Threat Analysis" },
            ].map((m, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center hover:bg-white/8 transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 inline-flex mb-4">
                  <m.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {m.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  Active
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-gray-300 mt-10">
          <p>Current Time: {currentTime.toLocaleTimeString()}</p>
          <p>Uptime: {formatUptime(systemStats.uptime)}</p>
          <p>Memory: {formatMemory(systemStats.memory)}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
