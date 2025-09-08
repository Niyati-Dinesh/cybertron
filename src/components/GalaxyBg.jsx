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

  const checkAuth = () => {
    const token = sessionStorage.getItem("token");
    const userEmail = sessionStorage.getItem("userEmail");
    return !!(token && userEmail);
  };

  useEffect(() => {
    setIsAuthenticated(checkAuth());
    const handleAuthChange = () => {
      const authStatus = checkAuth();
      setIsAuthenticated(authStatus);
      setAuthKey(prev => prev + 1);
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

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
      <div className="relative z-10">
        <NavBar key={authKey} />
        <div className="pt-20"> {/* This fixes the navbar overlap */}
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
              element={isAuthenticated ? <Dashboard/> : <Hero />} 
            />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default GalaxyBg;