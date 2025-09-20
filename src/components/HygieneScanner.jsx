

import { useState } from "react"
// In HygieneScanner.jsx
import { useHygiene } from "../context/HygieneContext"; // Correct

const HygieneScanner = () => {
  const { hygieneData, isLoading, error, runHygieneScan } = useHygiene()
  const [expandedSections, setExpandedSections] = useState({
    binaries: false,
    executables: false,
    diskUsage: false,
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getRiskLevel = (count, type) => {
    if (type === "binaries" && count > 0) return "high"
    if (type === "executables" && count > 5) return "high"
    if (type === "executables" && count > 0) return "medium"
    return "low"
  }

  const getRiskColor = (level) => {
    switch (level) {
      case "high":
        return "text-red-400 border-red-400/20 bg-red-400/10"
      case "medium":
        return "text-yellow-400 border-yellow-400/20 bg-yellow-400/10"
      default:
        return "text-green-400 border-green-400/20 bg-green-400/10"
    }
  }

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Libertinus Sans, serif" }}>
            System Hygiene Scanner
          </h3>
          <p className="text-gray-400 text-sm">Analyze file system security and disk usage</p>
        </div>
        <button
          onClick={runHygieneScan}
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 border ${
            isLoading
              ? "bg-gray-600/20 text-gray-400 border-gray-500/20 cursor-not-allowed"
              : "bg-cyan-400/10 text-cyan-400 border-cyan-400/20 hover:bg-cyan-400/20 hover:border-cyan-400/40"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Scanning...</span>
            </div>
          ) : (
            "Start Scan"
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-400 rounded-full"></div>
            <span className="text-red-400 font-medium">Scan Failed</span>
          </div>
          <p className="text-red-300 text-sm mt-2">{error.message || "An error occurred during the hygiene scan"}</p>
        </div>
      )}

      {/* Results */}
      {hygieneData && (
        <div className="space-y-6">
          {/* Scan Info */}
          <div className="flex items-center justify-between text-sm text-gray-400 pb-4 border-b border-white/10">
            <span>Last scan: {formatTimestamp(hygieneData.scanTimestamp)}</span>
            <span className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Scan completed</span>
            </span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* World Writable Binaries */}
            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${getRiskColor(
                getRiskLevel(hygieneData.worldWritableBinaries?.length || 0, "binaries"),
              )}`}
              onClick={() => toggleSection("binaries")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">World-Writable Binaries</p>
                  <p className="text-2xl font-bold">{hygieneData.worldWritableBinaries?.length || 0}</p>
                </div>
                <div className="text-xl">{expandedSections.binaries ? "−" : "+"}</div>
              </div>
            </div>

            {/* Suspicious Executables */}
            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${getRiskColor(
                getRiskLevel(hygieneData.suspiciousExecutables?.length || 0, "executables"),
              )}`}
              onClick={() => toggleSection("executables")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Suspicious Executables</p>
                  <p className="text-2xl font-bold">{hygieneData.suspiciousExecutables?.length || 0}</p>
                </div>
                <div className="text-xl">{expandedSections.executables ? "−" : "+"}</div>
              </div>
            </div>

            {/* Disk Usage */}
            <div
              className="p-4 rounded-lg border cursor-pointer transition-all duration-300 text-blue-400 border-blue-400/20 bg-blue-400/10"
              onClick={() => toggleSection("diskUsage")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Large Directories</p>
                  <p className="text-2xl font-bold">{hygieneData.diskUsageTop?.length || 0}</p>
                </div>
                <div className="text-xl">{expandedSections.diskUsage ? "−" : "+"}</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {expandedSections.binaries && hygieneData.worldWritableBinaries?.length > 0 && (
            <div className="bg-red-400/5 border border-red-400/10 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-3">World-Writable Binaries</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hygieneData.worldWritableBinaries.map((binary, index) => (
                  <div key={index} className="text-sm text-gray-300 font-mono bg-black/20 p-2 rounded">
                    {binary}
                  </div>
                ))}
              </div>
            </div>
          )}

          {expandedSections.executables && hygieneData.suspiciousExecutables?.length > 0 && (
            <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-lg p-4">
              <h4 className="text-yellow-400 font-semibold mb-3">Suspicious Executables</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hygieneData.suspiciousExecutables.map((executable, index) => (
                  <div key={index} className="text-sm text-gray-300 font-mono bg-black/20 p-2 rounded">
                    {executable}
                  </div>
                ))}
              </div>
            </div>
          )}

          {expandedSections.diskUsage && hygieneData.diskUsageTop?.length > 0 && (
            <div className="bg-blue-400/5 border border-blue-400/10 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-3">Largest Directories</h4>
              <div className="space-y-2">
                {hygieneData.diskUsageTop.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm bg-black/20 p-3 rounded">
                    <span className="text-gray-300 font-mono flex-1">{item.path}</span>
                    <span className="text-blue-400 font-semibold ml-4">{item.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {hygieneData.recommendations?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3" style={{ fontFamily: "Libertinus Sans, serif" }}>
                Security Recommendations
              </h4>
              <div className="space-y-3">
                {hygieneData.recommendations.map((recommendation, index) => {
                  const isHighRisk = recommendation.toLowerCase().includes("high risk")
                  const isWarning = recommendation.toLowerCase().includes("warning")

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        isHighRisk
                          ? "bg-red-400/10 border-red-400/20 text-red-300"
                          : isWarning
                            ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-300"
                            : "bg-blue-400/10 border-blue-400/20 text-blue-300"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            isHighRisk ? "bg-red-400" : isWarning ? "bg-yellow-400" : "bg-blue-400"
                          }`}
                        ></div>
                        <p className="leading-relaxed">{recommendation}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No Issues Found */}
          {hygieneData.worldWritableBinaries?.length === 0 && hygieneData.suspiciousExecutables?.length === 0 && (
            <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-green-400 rounded-full"></div>
              </div>
              <h4 className="text-green-400 font-semibold mb-2">System Clean</h4>
              <p className="text-green-300 text-sm">No security issues detected in the file system scan</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hygieneData && !isLoading && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white/30 border-dashed rounded-full"></div>
          </div>
          <p className="text-gray-400 text-lg mb-2">Ready to scan</p>
          <p className="text-gray-500 text-sm">Click "Start Scan" to analyze your system's file security</p>
        </div>
      )}
    </div>
  )
}

export default HygieneScanner
