// src/context/HygieneContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "../api/axiosInstance";

const HygieneContext = createContext();

export const HygieneProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [worldWritable, setWorldWritable] = useState([]);
  const [suspiciousExecutables, setSuspiciousExecutables] = useState([]);
  const [diskUsageTop, setDiskUsageTop] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  const fetchHygieneScan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setScanCompleted(false);

      const { data } = await axios.get("/hygiene/scan");

      setWorldWritable(data.worldWritableBinaries || []);
      setSuspiciousExecutables(data.suspiciousExecutables || []);
      setDiskUsageTop(data.diskUsageTop || []);
      setRecommendations(data.recommendations || []);
      setLastScan(new Date(data.scanTimestamp));
      setScanCompleted(true);
    } catch (err) {
      console.error("❌ Hygiene scan failed:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <HygieneContext.Provider
      value={{
        loading,
        lastScan,
        scanCompleted,
        worldWritable,
        suspiciousExecutables,
        diskUsageTop,
        recommendations,
        error,
        fetchHygieneScan,
      }}
    >
      {children}
    </HygieneContext.Provider>
  );
};

export const useHygiene = () => {
  const context = useContext(HygieneContext);
  if (!context) throw new Error("useHygiene must be used within a HygieneProvider");
  return context;
};
