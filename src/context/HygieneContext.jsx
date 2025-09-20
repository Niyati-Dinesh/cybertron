import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios'; // Use the standard axios library
import { toast } from 'react-hot-toast';

// 1. Create the context
const HygieneContext = createContext();

// 2. Create the provider component
export const HygieneProvider = ({ children }) => {
  const [hygieneData, setHygieneData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Added token retrieval function, just like in PortScanContext
  const getAuthToken = () => sessionStorage.getItem('token');

  // Function to run the scan
  const runHygieneScan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log("🚀 Starting file-system hygiene scan from frontend...");

    try {
      // ✅ Manually get the token
      const token = getAuthToken();
      if (!token) {
        setError('Not authenticated');
        setIsLoading(false);
        toast.error('Authentication token is missing.');
        return;
      }

      // ✅ Use the full URL and manually set the header, just like in PortScanContext
      const response = await axios.get('http://localhost:5000/api/routes/hygiene/scan', {
        headers: {
          authtoken: token // Send the token directly without "Bearer"
        },
        timeout: 120000 // Increased timeout for potentially long scans
      });

      setHygieneData(response.data);
      toast.success('Hygiene scan completed successfully!');

    } catch (err) {
      setError(err);
      const errorMessage = err.response?.data?.message || err.message || 'Scan failed';
      toast.error(errorMessage);
      console.error("Hygiene scan failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    hygieneData,
    isLoading,
    error,
    runHygieneScan,
  };

  return (
    <HygieneContext.Provider value={value}>
      {children}
    </HygieneContext.Provider>
  );
};

// 3. Create a custom hook to use the context
export const useHygiene = () => {
  const context = useContext(HygieneContext);
  if (context === undefined) {
    throw new Error('useHygiene must be used within a HygieneProvider');
  }
  return context;
};