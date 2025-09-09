"use client"
import {
  Search,
  RefreshCw,
  Shield,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Filter,
  Activity,
  Monitor,
  Cpu,
  HardDrive,
  Users,
  Clock,
  Zap,
  Server,
  Gauge,
} from "lucide-react"
import { useContext, useEffect, useState } from "react"
import { ScanContext } from "../context/ScanContext"
import axios from "axios"

const ProcessTable = () => {
  const { 
    processData, 
    fetchProcesses, 
    backgroundFetchProcesses, 
    loading, 
    backgroundLoading, 
    error,
    statistics,
    getProcessCountBySeverity,
    getSystemStats
  } = useContext(ScanContext)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeverity, setSelectedSeverity] = useState("All")
  const [expandedArgs, setExpandedArgs] = useState(new Set())
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [visibleProcessesCount, setVisibleProcessesCount] = useState(10)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    // Initial load with loading spinner
    fetchProcesses()

    // Background refresh every 5 seconds WITHOUT loading spinner
    const interval = setInterval(() => {
      backgroundFetchProcesses() // Silent refresh
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (processData.length > 0) {
      console.log("[v0] Sample process data:", processData[0])
      console.log("[v0] All fields:", Object.keys(processData[0]))
    }
  }, [processData])

  const fixProcessData = (processes) => {
    return processes.map((process) => {
      // Check if data is misaligned (username in etime field)
      if (process.etime && typeof process.etime === "string" && process.etime.match(/^[a-zA-Z]+$/)) {
        // Data is misaligned - try to fix it
        return {
          ...process,
          user: process.etime, // Move username from etime to user
          etime: (process.args && process.args.split(" ")[0]) || "00:00", // Try to extract time or use default
          args:
            process.args && process.args.includes(" ")
              ? process.args.substring(process.args.indexOf(" ") + 1)
              : process.args,
        }
      }
      return process
    })
  }

  const trustProcess = async (comm, args) => {
    const token = sessionStorage.getItem("token")
    try {
      await axios.post(
        "http://localhost:5000/api/routes/scan/trust-process",
        { comm, args },
        { headers: { authtoken: token } },
      )
      // Silent refresh after trust action
      backgroundFetchProcesses()
    } catch (err) {
      alert("Failed to trust process.")
      console.error("Trust process error:", err.response?.data || err.message)
    }
  }

  const killProcess = async (pid) => {
    const token = sessionStorage.getItem("token")
    try {
      await axios.post("http://localhost:5000/api/routes/scan/kill-process", { pid }, { headers: { authtoken: token } })
      // Silent refresh after kill action
      backgroundFetchProcesses()
    } catch (err) {
      alert(`Failed to kill process ${pid}.`)
      console.error("Kill process error:", err.response?.data || err.message)
    }
  }

  const getBadgeColor = (severity) => {
    switch (severity) {
      case "High":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "Trusted":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      default:
        return "bg-green-500/10 text-green-400 border-green-500/20"
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "High":
        return <AlertTriangle className="w-4 h-4" />
      case "Medium":
        return <AlertTriangle className="w-4 h-4" />
      case "Trusted":
        return <Shield className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const rawFilteredProcesses = processData.filter(
    (process) =>
      (selectedSeverity === "All" || process.severity === selectedSeverity) &&
      (process.comm.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (process.user && process.user.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        process.pid.toString().includes(debouncedSearchTerm)),
  )

  const filteredProcesses = fixProcessData(rawFilteredProcesses)

  const toggleArgsExpansion = (index) => {
    const newExpanded = new Set(expandedArgs)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedArgs(newExpanded)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setSelectedSeverity("All")
  }

  const hasMoreProcesses = filteredProcesses.length > visibleProcessesCount

  // Get enhanced stats and process counts
  const systemStats = getSystemStats()
  const processCount = getProcessCountBySeverity()

  return (
    <div className=" backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border border-cyan-400/20">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "Libertinus Sans, serif" }}
              >
                System Processes
              </h2>
              {/* Background loading indicator - small and subtle */}
              {backgroundLoading && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 border border-cyan-400/20 rounded-full">
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                  <span className="text-xs text-cyan-400">Updating...</span>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm" style={{ fontFamily: "Open Sans, sans-serif" }}>
              Real-time monitoring • Auto-refresh every 5s
            </p>
          </div>
        </div>

        {/* Manual Scan Button */}
        <button
          onClick={() => fetchProcesses(true)} // Manual scan with loading
          className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 rounded-xl hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 ${loading ? "animate-pulse" : ""}`}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {/* Enhanced Stats Row with server data */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { 
            label: "Total", 
            value: processCount?.total || processData.length, 
            icon: Monitor, 
            color: "cyan" 
          },
          {
            label: "High Risk",
            value: processCount?.high || processData.filter((p) => p.severity === "High").length,
            icon: AlertTriangle,
            color: "red",
          },
          {
            label: "Medium Risk",
            value: processCount?.medium || processData.filter((p) => p.severity === "Medium").length,
            icon: AlertTriangle,
            color: "yellow",
          },
          {
            label: "Trusted",
            value: processCount?.trusted || processData.filter((p) => p.severity === "Trusted").length,
            icon: Shield,
            color: "blue",
          },
          {
            label: "Safe",
            value: processCount?.low || processData.filter((p) => p.severity === "Low").length,
            icon: Shield,
            color: "green",
          },
        ].map((stat, idx) => (
          <div key={idx} className="bg-black/30 border border-gray-700/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            </div>
          </div>
        ))}
      </div>

      {/* Additional System Stats Row (if statistics available) */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/20 border border-gray-700/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Total CPU</p>
                <p className="text-xl font-bold text-white">{statistics.totalCpuUsage}%</p>
              </div>
              <Cpu className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <div className="bg-black/20 border border-gray-700/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Total Memory</p>
                <p className="text-xl font-bold text-white">{statistics.totalMemoryUsage}%</p>
              </div>
              <HardDrive className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="bg-black/20 border border-gray-700/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">High CPU</p>
                <p className="text-xl font-bold text-white">{statistics.highCpuProcesses}</p>
              </div>
              <Gauge className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="bg-black/20 border border-gray-700/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Root Processes</p>
                <p className="text-xl font-bold text-white">{statistics.rootProcesses}</p>
              </div>
              <Server className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search processes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/30 border border-gray-700/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full pl-12 pr-8 py-3 bg-black/30 border border-gray-700/30 rounded-xl text-white appearance-none focus:outline-none focus:border-cyan-400/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm cursor-pointer"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            <option value="All" className="bg-gray-800">
              All Severities
            </option>
            <option value="High" className="bg-gray-800">
              High Risk
            </option>
            <option value="Medium" className="bg-gray-800">
              Medium Risk
            </option>
            <option value="Low" className="bg-gray-800">
              Low Risk
            </option>
            <option value="Trusted" className="bg-gray-800">
              Trusted
            </option>
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-black/30 border border-gray-700/30 text-gray-400 rounded-xl hover:bg-black/40 hover:border-gray-600/30 transition-all duration-300 backdrop-blur-sm"
          style={{ fontFamily: "Open Sans, sans-serif" }}
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Process Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700/20 backdrop-blur-sm">
        <table className="min-w-full">
          <thead className="bg-black/40 backdrop-blur-sm">
            <tr className="border-b border-gray-700/20">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>PID</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Command</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4" />
                  <span>CPU</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4" />
                  <span>Memory</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>User</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Time</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Arguments
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {/* Only show loading spinner for MANUAL scans, not background updates */}
            {loading && processData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                    <span className="text-gray-300 text-lg font-medium">Analyzing system processes...</span>
                    <span className="text-gray-500 text-sm">This may take a few moments</span>
                  </div>
                </td>
              </tr>
            ) : filteredProcesses.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <Monitor className="w-16 h-16 text-gray-600" />
                    <span className="text-gray-400 text-lg">No processes found</span>
                    <span className="text-gray-500 text-sm">Try adjusting your search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProcesses.slice(0, visibleProcessesCount).map((p, index) => (
                <tr key={index} className="hover:bg-white/5 transition-all duration-200">
                  <td className="px-6 py-4 text-sm text-white font-mono">{p.pid}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-800/50">
                        <Activity className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-white font-medium">{p.comm}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-700/30 rounded-full h-2">
                        <div
                          className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(Number.parseFloat(p.cpu) || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-300 text-sm font-mono">{p.cpu}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-700/30 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(Number.parseFloat(p.mem) || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-300 text-sm font-mono">{p.mem}%</span>
                      {/* Show enhanced memory details if available */}
                      {p.memoryDetails && p.memoryDetails.virtualSize > 0 && (
                        <div className="text-xs text-gray-500 ml-2">
                          ({p.memoryDetails.residentSize}MB)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{p.user || "unknown"}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                    {p.etime && !p.etime.match(/^[a-zA-Z]+$/) ? p.etime : "00:00"}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center space-x-2 px-3 py-1 text-xs font-medium rounded-full border ${getBadgeColor(p.severity)}`}
                    >
                      {getSeverityIcon(p.severity)}
                      <span>{p.severity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono ${expandedArgs.has(index) ? "" : "truncate"}`}>
                        {expandedArgs.has(index)
                          ? p.args
                          : p.args && p.args.length > 50
                            ? `${p.args.substring(0, 50)}...`
                            : p.args || "N/A"}
                      </span>
                      {p.args && p.args.length > 50 && (
                        <button
                          onClick={() => toggleArgsExpansion(index)}
                          className="p-1 rounded-lg hover:bg-gray-700/30 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {expandedArgs.has(index) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.severity !== "Low" && p.severity !== "Trusted" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => trustProcess(p.comm, p.args)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/20 transition-all duration-200"
                        >
                          <Shield className="w-3 h-3" />
                          <span>Trust</span>
                        </button>
                        <button
                          onClick={() => killProcess(p.pid)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-all duration-200"
                        >
                          <X className="w-3 h-3" />
                          <span>Kill</span>
                        </button>
                      </div>
                    )}
                    {p.severity === "Trusted" && (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="text-gray-400 text-sm">Trusted</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Show More Button */}
      {hasMoreProcesses && (
        <div className="text-center mt-6">
          <button
            onClick={() => setVisibleProcessesCount((prev) => prev + 10)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-xl text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 backdrop-blur-sm"
            style={{ fontFamily: "Open Sans, sans-serif" }}
          >
            Load More Processes ({filteredProcesses.length - visibleProcessesCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}

export default ProcessTable