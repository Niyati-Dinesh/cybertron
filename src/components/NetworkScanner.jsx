import React, { useState, useCallback } from "react";
import {
  EthernetPort,
  RefreshCw,
  Wifi,
  Cpu,
  Shield,
  X,
  Globe2,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import axios from "../api/axiosInstance";

export default function NetworkScanner() {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get(`network/devices`);
      setDevices(data);
    } catch (err) {
      console.error("❌ Error fetching devices:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const trustDevice = useCallback(
    async (mac) => {
      try {
        await axios.post(`network/trust`, { mac });
        await fetchDevices();
      } catch (err) {
        console.error("❌ Error trusting device:", err);
        setError(err.response?.data?.message || err.message);
      }
    },
    [fetchDevices]
  );

  return (
    <div className="p-6 relative mt-3 border border-white/10 rounded-xl text-white bg-gradient-to-br from-gray-900/50 to-blue-900/20 backdrop-blur-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 mr-4 shadow-lg">
            <EthernetPort className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2
              className="text-2xl font-bold bg-white bg-clip-text text-transparent"
              style={{ fontFamily: "Libertinus Sans, serif" }}
            >
              Network Scanner
            </h2>
            <p className="text-gray-300">Discover and manage network devices</p>
          </div>
        </div>

        {/* Scan Button */}
        <button
          onClick={fetchDevices}
          className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 rounded-xl hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 ${
            loading ? "animate-pulse" : ""
          }`}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700/20 backdrop-blur-sm">
        <table className="min-w-full">
          <thead className="bg-black/40 backdrop-blur-sm">
            <tr className="border-b border-gray-700/20">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span>IP Address</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>MAC Address</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <span>Vendor</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Status</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700/20">
            {/* Loading Spinner */}
            {loading && (
              <tr>
                <td colSpan="5" className="text-center py-10">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
                  <p className="text-gray-400 mt-2">Scanning network...</p>
                </td>
              </tr>
            )}

            {/* No Devices Found */}
            {!loading && devices.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-400">
                  No devices found
                </td>
              </tr>
            )}

            {/* Device Rows */}
            {!loading &&
              devices.map((device, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/5 transition-all duration-200"
                >
                  <td className="px-6 py-4 font-mono text-sm">{device.ip}</td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {device.mac || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {device.vendor || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {device.isTrusted ? (
                      <span className="flex items-center text-green-400">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Trusted
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-400">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Untrusted
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {!device.isTrusted && device.mac ? (
                      <button
                        onClick={() => trustDevice(device.mac)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs hover:bg-green-500/20 transition-all duration-200"
                      >
                        <Shield className="w-3 h-3" />
                        <span>Trust</span>
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
