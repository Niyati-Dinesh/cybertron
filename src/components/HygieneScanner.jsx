import React, { useState } from "react";
import { RefreshCw,CircleCheck  } from "lucide-react";
import axios from "../api/axiosInstance"; 

export default function HygieneScanner() {
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [worldWritable, setWorldWritable] = useState([]);
  const [suspiciousExecutables, setSuspiciousExecutables] = useState([]);
  const [diskUsageTop, setDiskUsageTop] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");

  const fetchHygieneScan = async () => {
    try {
      setLoading(true);
      setScanCompleted(false);
      setError("");

      const res = await axios.get("/hygiene/scan");
      const data = res.data;

      setWorldWritable(data.worldWritableBinaries || []);
      setSuspiciousExecutables(data.suspiciousExecutables || []);
      setDiskUsageTop(data.diskUsageTop || []);
      setRecommendations(data.recommendations || []);
      setLastScan(data.scanTimestamp ? new Date(data.scanTimestamp) : new Date());
      setScanCompleted(true);
    } catch (err) {
      console.error("Error scanning system:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to perform hygiene scan."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "Not yet scanned";
    return date.toLocaleString();
  };

  return (
    <div className="p-6 relative mt-3 border border-white/10 rounded-xl text-white bg-gradient-to-br from-gray-900/50 to-blue-900/20 backdrop-blur-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold bg-white bg-clip-text text-transparent"
            style={{ fontFamily: "Libertinus Sans, serif" }}
          >
            System Hygiene Scanner
          </h2>
          <p className="text-gray-300">Analyze file system security and disk usage</p>

          <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
            <p>Last scan: {formatDateTime(lastScan)}</p>
            {scanCompleted && !error && (
              <div className="flex items-center gap-1 text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Scan completed</span>
              </div>
            )}
            {error && <span className="text-red-400">{error}</span>}
          </div>
        </div>

        <button
          onClick={fetchHygieneScan}
          className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 rounded-xl hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 ${
            loading ? "animate-pulse" : ""
          }`}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      <div className="w-full h-[2px] bg-gray-600/50 mt-3 rounded-full"></div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 mt-6">
        {/* World-Writable Binaries */}
        <div className="border-2 sm:w-90 sm:h-20 rounded-lg w-76 h-16 border-green-500/20 bg-green-400/20 flex items-center justify-between px-3">
          <span className="text-green-400 text-sm font-bold">
            World-Writable Binaries
            <span className="block mt-1 text-green-300">{worldWritable.length || 0}</span>
          </span>
          <span className="text-green-400 text-lg font-bold cursor-pointer">+</span>
        </div>

        {/* Suspicious Executables */}
        <div className="border-2 sm:w-90 sm:h-20 rounded-lg w-76 h-16  border-green-500/20 bg-green-400/20 flex items-center justify-between px-3">
          <span className="text-green-400 text-sm font-bold">
            Suspicious Executables
            <span className="block mt-1 text-green-300">
              {suspiciousExecutables.length || 0}
            </span>
          </span>
          <span className="text-green-400 text-lg font-bold cursor-pointer">+</span>
        </div>

        {/* Large Directories */}
        <div className="border-2 sm:w-90 sm:h-20 rounded-lg w-76 h-16  border-cyan-400/30 bg-cyan-400/30 flex items-center justify-between px-3">
          <span className="text-cyan-400 text-sm font-bold">
            Large Directories
            <span className="block mt-1 text-cyan-300">{diskUsageTop.length || 0}</span>
          </span>
          <span className="text-cyan-300 text-lg font-bold cursor-pointer">+</span>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="mt-5">
        <div className="border-2 w-full rounded-lg border-white/20 bg-white/7 p-3">
          <div className="flex items-center gap-3 mb-3">
            <h3
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Libertinus Sans, serif" }}
            >
              Security Recommendations
            </h3>
          </div>

          <div className="border-2 border-cyan-400/30 bg-cyan-300 rounded-lg p-3 bg-white/5">
            {recommendations.length > 0 ? (
              <ul className="list-none space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-2 h-2 mt-2 bg-cyan-400 rounded-full flex-shrink-0" />
                    <p className="text-cyan-300 text-sm">{rec}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No recommendations at this time.</p>
            )}
          </div>
        </div>
      </div>

      {scanCompleted &&
      worldWritable.length === 0 &&
      suspiciousExecutables.length === 0 &&
      !error && (
        <>
        <div className="flex mt-3">
        <div className="border-2 w-full h-40 rounded-lg border-green-500/20 bg-green-400/20 flex flex-col items-center justify-center text-center px-3">
          <CircleCheck className="w-10 h-10 text-green-400 mb-3" />
          <h3 className="text-green-400 text-lg font-bold">System Clean</h3>
          <p className="text-green-300 mt-2 text-sm">
            No security issues detected in the file system scan
          </p>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
