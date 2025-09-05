import React from "react";
import NavBar from "./NavBar";
import AuthComponent from "./AuthComponent";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Hero from "./Hero";
const GalaxyBg = () => {
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
        <NavBar />
        <Routes>
          <Route path='/' element={<Hero />} />
          <Route path='/user' element={<AuthComponent />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default GalaxyBg;