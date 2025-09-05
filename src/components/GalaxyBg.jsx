import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import AuthComponent from "./AuthComponent";
import { Routes, Route, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import Hero from "./Hero";
import PageNotFound from "./PageNotFound";

const GalaxyBg = () => {
  const [authKey, setAuthKey] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check authentication status
  const checkAuth = () => {
    const token = sessionStorage.getItem("token");
    const userEmail = sessionStorage.getItem("userEmail");
    return !!(token && userEmail);
  };

  useEffect(() => {
    // Initial auth check
    setIsAuthenticated(checkAuth());

    const handleAuthChange = () => {
      // Update auth state and force navbar re-render
      const authStatus = checkAuth();
      setIsAuthenticated(authStatus);
      setAuthKey(prev => prev + 1);
    };

    // Listen for auth changes
    window.addEventListener('authChange', handleAuthChange);

    // Cleanup
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Handle logout navigation
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (!isAuthenticated && currentPath === "/dashboard") {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Stars */}
      {[...Array(60)].map((_, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: `${Math.random() * 100}vh`,
            left: `${Math.random() * 100}vw`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <div className="relative">
        <NavBar key={authKey} />
        <Routes>
          <Route 
            path='/' 
            element={isAuthenticated ? <Dashboard /> : <Hero />} 
          />
          <Route 
            path='/user' 
            element={isAuthenticated ? <Dashboard /> : <AuthComponent />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Hero />} 
          />
          <Route 
            path="/success" 
            element={isAuthenticated ? <Dashboard /> : <Hero />} 
          />
          
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </div>
  );
};

export default GalaxyBg;