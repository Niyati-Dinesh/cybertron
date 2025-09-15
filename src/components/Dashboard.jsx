"use client"

import { useContext, useState, useEffect } from "react"
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
} from "lucide-react"
import { ScanContext } from "../context/ScanContext"
import ProcessTable from "./ProcessTable"
import PortScannerPanel from "./PortScannerPanel"

const Dashboard = () => {
  const { processData, systemInfo, fetchProcesses, loading, backgroundLoading, scanTimestamp, getSystemStats } =
    useContext(ScanContext)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [hasInitialScan, setHasInitialScan] = useState(
    sessionStorage.getItem("hasInitialScan") === "true", // persist across refresh
  )
  const [shouldStartPortScanning, setShouldStartPortScanning] = useState(false)
  const [isRefreshingAllModules, setIsRefreshingAllModules] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (processData.length > 0 && !hasInitialScan) {
      setHasInitialScan(true)
      sessionStorage.setItem("hasInitialScan", "true")
    }
  }, [processData, hasInitialScan])

  const handleInitialScan = async () => {
    // Start all modules scanning
    await fetchProcesses(true)
    setShouldStartPortScanning(true)
  }

  const handleRefreshAllModules = async () => {
    setIsRefreshingAllModules(true)
    try {
      // Refresh processes manually (this will show loading state)
      await fetchProcesses(true)
      // Trigger port scanner refresh
      setShouldStartPortScanning((prev) => !prev) // Toggle to trigger refresh
    } finally {
      setIsRefreshingAllModules(false)
    }
  }

  const systemStats = getSystemStats()

  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return null
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatMemory = (bytes) => {
    if (!bytes) return null
    const gb = (bytes / 1024 / 1024 / 1024).toFixed(1)
    return `${gb} GB`
  }

  const getOSDisplayName = () => {
    if (!systemInfo) return "System"
    if (systemInfo.platform === "linux") {
      if (systemInfo.osRelease?.toLowerCase().includes("kali")) return "Kali Linux"
      if (systemInfo.version?.toLowerCase().includes("ubuntu")) return "Ubuntu Linux"
      if (systemInfo.version?.toLowerCase().includes("debian")) return "Debian Linux"
      if (systemInfo.version?.toLowerCase().includes("fedora")) return "Fedora Linux"
      if (systemInfo.version?.toLowerCase().includes("centos")) return "CentOS Linux"
      if (systemInfo.version?.toLowerCase().includes("arch")) return "Arch Linux"
      return "Linux"
    }
    return systemInfo.platform
      ? `${systemInfo.platform.charAt(0).toUpperCase()}${systemInfo.platform.slice(1)}`
      : "System"
  }

  const getOSVersion = () => {
    if (!systemInfo) return ""
    if (systemInfo.osRelease?.includes('VERSION="')) {
      const versionMatch = systemInfo.osRelease.match(/VERSION="([^"]+)"/)
      if (versionMatch) return versionMatch[1]
    }
    return systemInfo.release || ""
  }

  // --- START MONITORING PAGE (before first scan) ---
  if (!hasInitialScan) {
    return (
      <div className="min-h-screen pt-20 pb-8 px-6 bg-transparent" style={{ fontFamily: "Open Sans, sans-serif" }}>
        <h1 className="text-4xl font-bold text-white mb-6">Welcome to Security Dashboard</h1>
        <p className="text-gray-400 text-lg max-w-2xl mb-10">
          Your system's first line of defense. Start monitoring now to analyze running processes, detect potential
          threats, and keep your machine safe in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <Cpu className="w-10 h-10 text-cyan-400 mb-4 mx-auto" />
            <h3 className="text-white font-semibold mb-2">Process Scanning</h3>
            <p className="text-gray-400 text-sm">Identify suspicious processes and stop them instantly.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <BarChart className="w-10 h-10 text-green-400 mb-4 mx-auto" />
            <h3 className="text-white font-semibold mb-2">Resource Insights</h3>
            <p className="text-gray-400 text-sm">Track CPU, memory, and system load in real time.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <Lock className="w-10 h-10 text-purple-400 mb-4 mx-auto" />
            <h3 className="text-white font-semibold mb-2">Network Awareness</h3>
            <p className="text-gray-400 text-sm">Monitor ports and detect unauthorized devices on your LAN.</p>
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
              <span>Scan Now</span>
            </div>
          )}
        </button>
      </div>
    )
  }

  // --- AFTER INITIAL SCAN (normal dashboard) ---
  return (
    <div className="min-h-screen pt-20 pb-8 px-6 bg-transparent" style={{ fontFamily: "Open Sans, sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          {/* Main heading section */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
            {/* Left side - System info */}
            <div className="flex-1 text-center lg:text-left">
              <h1
                className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight"
                style={{ fontFamily: "Libertinus Sans, serif" }}
              >
                {getOSDisplayName()}
              </h1>

              <div className="space-y-3 text-lg text-gray-300">
                {systemInfo && (
                  <>
                    <div className="flex items-center justify-center lg:justify-start space-x-2">
                      <Monitor className="w-5 h-5 text-cyan-400" />
                      <span>{systemInfo.arch} architecture</span>
                    </div>
                    {getOSVersion() && (
                      <div className="flex items-center justify-center lg:justify-start space-x-2">
                        <Shield className="w-5 h-5 text-cyan-400" />
                        <span>Version {getOSVersion()}</span>
                      </div>
                    )}
                    {systemStats?.memoryUsage && (
                      <div className="flex items-center justify-center lg:justify-start space-x-2">
                        <HardDrive className="w-5 h-5 text-purple-400" />
                        <span>
                          {systemStats.memoryUsage}% memory used ({formatMemory(systemInfo.totalMemory)} total)
                        </span>
                      </div>
                    )}
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

            {/* Right side - Floating Scan Button */}
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
            {/* Process Monitor - Active */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center hover:bg-white/8 transition-all duration-300">
              <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 inline-flex mb-4">
                <Activity className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Process Monitor</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Real-time process analysis and threat detection
              </p>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Active</span>
              </div>
            </div>

            {/* Port Scanner - Active */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center hover:bg-white/8 transition-all duration-300">
              <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 inline-flex mb-4">
                <Network className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Port Scanner</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Network port analysis and vulnerability detection
              </p>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Active</span>
              </div>
            </div>

            {/* Other modules - Coming Soon */}
            {[
              { icon: Wifi, title: "Device Discovery", desc: "Network device mapping and identification" },
              { icon: AlertTriangle, title: "Threat Analysis", desc: "Advanced security assessment and reporting" },
            ].map((module, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center opacity-60"
              >
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

        <div className="space-y-8 bg-transparent backdrop-blur-sm">
          <PortScannerPanel shouldAutoStart={shouldStartPortScanning} refreshTrigger={isRefreshingAllModules} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
