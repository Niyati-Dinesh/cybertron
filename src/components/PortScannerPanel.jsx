import React, { useState, useEffect } from 'react';
import { usePortScan } from '../context/PortScanContext';
import { Scan, RefreshCw, AlertTriangle, Server, Shield } from 'lucide-react';

export default function PortScannerPanel() {
  const { services, vulnerabilities, loading, error, scanAndCorrelate, clear } = usePortScan();
  const [target, setTarget] = useState('127.0.0.1');
  const [localServices, setLocalServices] = useState([]);
  const [localVulnerabilities, setLocalVulnerabilities] = useState([]);

  // Update local state when context changes
  useEffect(() => {
    setLocalServices(services);
    setLocalVulnerabilities(vulnerabilities);
  }, [services, vulnerabilities]);

  const onScan = async () => {
    await scanAndCorrelate({ target });
  };

  return (
    <div className="p-6 relative  border border-white/10 rounded-xl text-white">
      <div className="flex items-center mb-6">
        <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 mr-4">
          <Server className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "Libertinus Sans, serif" }}>
            Port & Service Scanner
          </h2>
          <p className="text-gray-400">Network port analysis and vulnerability detection</p>
        </div>
      </div>

      <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
        <label className="block text-sm font-medium mb-3 text-gray-300">Target (IP / CIDR):</label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input 
            value={target} 
            onChange={(e) => setTarget(e.target.value)} 
            className="flex-1 bg-black/30 border border-white/20 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" 
            placeholder="Enter IP address or hostname"
          />
          <div className="flex gap-2">
            <button 
              onClick={onScan} 
              disabled={loading} 
              className="flex items-center px-6 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 rounded-lg hover:bg-cyan-500/30 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              onClick={clear} 
              className="px-4 py-3 bg-gray-700/30 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-700/50 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-400/10 border border-red-400/20 text-red-400 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="mb-6 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 px-4 py-3 rounded-lg flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          <span>Scanning in progress... This may take a few minutes.</span>
        </div>
      )}

      {/* Services Section */}
      <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-cyan-400" />
          Discovered Services ({localServices.length})
        </h3>
        
        {localServices.length === 0 ? (
          <div className="bg-black/30 p-6 rounded-lg text-center border border-dashed border-white/10">
            <Server className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">
              {loading ? 'Scanning for services...' : 'No services found. Run a scan to discover services.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">IP Address</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Port/Protocol</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Service Name</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Product</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Version</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">State</th>
                </tr>
              </thead>
              <tbody>
                {localServices.map((s, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white/5' : 'bg-white/3'}>
                    <td className="p-3 border-t border-white/10">{s.ip}</td>
                    <td className="p-3 border-t border-white/10 font-mono">{s.port}/{s.protocol}</td>
                    <td className="p-3 border-t border-white/10 font-medium">{s.name}</td>
                    <td className="p-3 border-t border-white/10">{s.product || '-'}</td>
                    <td className="p-3 border-t border-white/10">{s.version || '-'}</td>
                    <td className="p-3 border-t border-white/10">
                      <span className={`px-2 py-1 rounded text-xs ${
                        s.state === 'open' ? 'bg-green-400/20 text-green-400 border border-green-400/30' :
                        s.state === 'closed' ? 'bg-red-400/20 text-red-400 border border-red-400/30' :
                        'bg-gray-400/20 text-gray-400 border border-gray-400/30'
                      }`}>
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
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
          Vulnerabilities ({localVulnerabilities.length})
        </h3>
        
        {localVulnerabilities.length === 0 ? (
          <div className="bg-black/30 p-6 rounded-lg text-center border border-dashed border-white/10">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-400">
              {loading ? 'Scanning for vulnerabilities...' : 'No vulnerabilities found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">CVE ID</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Severity</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Description</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Service</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-300">Source</th>
                </tr>
              </thead>
              <tbody>
                {localVulnerabilities.map((v, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : 'bg-white/3'}>
                    <td className="p-3 border-t border-white/10 font-mono">
                      <a 
                        href={`https://nvd.nist.gov/vuln/detail/${v.cveId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        {v.cveId}
                      </a>
                    </td>
                    <td className="p-3 border-t border-white/10">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        v.severity === 'HIGH' || v.severity === 'CRITICAL' ? 
                          'bg-red-400/20 text-red-400 border-red-400/30' :
                        v.severity === 'MEDIUM' ? 
                          'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' :
                        v.severity === 'LOW' ? 
                          'bg-green-400/20 text-green-400 border-green-400/30' :
                          'bg-gray-400/20 text-gray-400 border-gray-400/30'
                      }`}>
                        {v.severity}
                      </span>
                    </td>
                    <td className="p-3 border-t border-white/10 max-w-md text-sm">{v.description}</td>
                    <td className="p-3 border-t border-white/10">
                      {v.service ? (
                        <div className="text-sm">
                          <div className="font-medium">{v.service.name}</div>
                          <div className="text-gray-400">{v.service.ip}:{v.service.port}</div>
                          {v.service.product && <div className="text-gray-500">{v.service.product}</div>}
                        </div>
                      ) : (
                        'Unknown service'
                      )}
                    </td>
                    <td className="p-3 border-t border-white/10">
                      <span className={`px-2 py-1 rounded text-xs border ${
                        v.source === 'NVD' ? 
                          'bg-blue-400/20 text-blue-400 border-blue-400/30' :
                        v.source === 'HARDCODED' ? 
                          'bg-purple-400/20 text-purple-400 border-purple-400/30' :
                          'bg-gray-400/20 text-gray-400 border-gray-400/30'
                      }`}>
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
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/10">
          <h4 className="font-semibold mb-2 text-gray-300">Debug Information:</h4>
          <div className="text-sm text-gray-400 grid grid-cols-2 gap-2">
            <p>Services count: {localServices.length}</p>
            <p>Vulnerabilities count: {localVulnerabilities.length}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
          </div>
        </div>
      )}
    </div>
  );
}