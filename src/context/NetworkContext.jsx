import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "../api/axiosInstance";

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = "http://localhost:5000/api/routes/network";

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get(`${API_BASE}/devices`);
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
        await axios.post(`${API_BASE}/trust`, { mac });
        await fetchDevices();
      } catch (err) {
        console.error("❌ Error trusting device:", err);
        setError(err.response?.data?.message || err.message);
      }
    },
    [fetchDevices]
  );

  return (
    <NetworkContext.Provider value={{ devices, loading, error, fetchDevices, trustDevice }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) throw new Error("useNetwork must be used within a NetworkProvider");
  return context;
};
