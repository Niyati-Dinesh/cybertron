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
  const [documentHeight, setDocumentHeight] = useState(0);
  const navigate = useNavigate();

  const checkAuth = () => {
    const token = sessionStorage.getItem("token");
    const userEmail = sessionStorage.getItem("userEmail");
    return !!(token && userEmail);
  };

  // Function to update document height
  const updateDocumentHeight = () => {
    const height = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      window.innerHeight
    );
    setDocumentHeight(height);
  };

  useEffect(() => {
    setIsAuthenticated(checkAuth());

    const handleAuthChange = () => {
      const authStatus = checkAuth();
      setIsAuthenticated(authStatus);
      setAuthKey((prev) => prev + 1);
    };

    window.addEventListener("authChange", handleAuthChange);

    // Update height initially and on resize/scroll
    updateDocumentHeight();

    const handleResize = () => updateDocumentHeight();
    const handleScroll = () => updateDocumentHeight();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(updateDocumentHeight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (!isAuthenticated && currentPath === "/dashboard") {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Generate stars based on document height
  const generateStars = () => {
    const stars = [];
    const starCount = Math.max(60, Math.floor(documentHeight / 20)); // More stars for taller content

    for (let i = 0; i < starCount; i++) {
      stars.push(
        <span
          key={i}
          className="star"
          style={{
            top: `${Math.random() * documentHeight}px`,
            left: `${Math.random() * 100}vw`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-black min-h-screen">
      {/* Stars Container - Fixed positioning covers entire document */}
      <div
        className="fixed top-0 left-0 w-full pointer-events-none z-0"
        style={{ height: `${documentHeight}px` }}
      >
        {generateStars()}
      </div>

      <div className="relative z-10">
        <NavBar key={authKey} />
        <div className="pt-20 min-h-screen bg-transparent">
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Dashboard /> : <Hero />}
            />
            <Route
              path="/user"
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
    </div>
  );
};

export default GalaxyBg;
