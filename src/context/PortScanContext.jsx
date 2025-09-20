import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

export const PortScanContext = createContext();

export const PortScanProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // token retrieval
  const getAuthToken = () => sessionStorage.getItem('token');

  const scanAndCorrelate = async ({ target } = {}) => {
    setLoading(true);
    setError('');
    setServices([]);
    setVulnerabilities([]);
    setScanResult(null);

    try {
      const token = getAuthToken();
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const url = `http://localhost:5000/api/routes/ports/scan${target ? `?target=${encodeURIComponent(target)}` : ''}`;
      console.log('🌐 Calling URL:', url);

      const resp = await axios.get(url, {
        headers: {
          authtoken: token
        },
        timeout: 180000
      });

      console.log('✅ Response received:', resp.data);

      if (resp.data) {
        setScanResult(resp.data);
        setServices(resp.data.services || []);
        setVulnerabilities(resp.data.vulnerabilities || []);
        
        if (!resp.data.services || resp.data.services.length === 0) {
          setError('No services found during scan');
        }
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('scanAndCorrelate error', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Scan failed';
      setError(errorMessage);
      
      if (errorMessage.includes('nmap not installed')) {
        setError('nmap is not installed on the server. Please install nmap to use port scanning.');
      }
    } finally {
      setLoading(false);
    }
  };

  const correlateServices = async (servicesToCheck = []) => {
    setLoading(true);
    setError('');
    setVulnerabilities([]);

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const resp = await axios.post('http://localhost:5000/api/routes/ports/correlate', 
        { services: servicesToCheck }, 
        {
          headers: {
            authtoken: token,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      setVulnerabilities(resp.data.vulnerabilities || []);
    } catch (err) {
      console.error('correlateServices error', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || 'Correlation failed');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { 
    setServices([]); 
    setVulnerabilities([]); 
    setError(''); 
    setScanResult(null);
  };

  const contextValue = {
    services,
    vulnerabilities,
    loading,
    error,
    scanResult,
    scanAndCorrelate,
    correlateServices,
    clear
  };

  return (
    <PortScanContext.Provider value={contextValue}>
      {children}
    </PortScanContext.Provider>
  );
};

export const usePortScan = () => useContext(PortScanContext);