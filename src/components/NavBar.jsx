"use client"

import { useState, useEffect } from "react"
import { User, LogOut } from "lucide-react"
import { Link } from "react-router-dom"

const NavBar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    const email = sessionStorage.getItem("userEmail")

    if (token && email) {
      setIsAuthenticated(true)
      setUserEmail(email)
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("userEmail")
    sessionStorage.removeItem("user")
    setIsAuthenticated(false)
    setUserEmail("")
    setShowUserMenu(false)
    
    // Trigger auth change event
    window.dispatchEvent(new CustomEvent('authChange'))
    
    window.location.href = "/"
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/30 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-white font-libertinus font-bold text-4xl tracking-tight">
              <Link to="/" className="hover:text-white/80 transition-colors duration-200">
                CyberTron
              </Link>
            </h1>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors duration-200 font-opensans text-base font-medium bg-white/5 hover:bg-white/10 px-5 py-3 rounded-lg border border-white/10"
                >
                  <User size={20} />
                  <span className="hidden md:block max-w-40 truncate">{userEmail}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg py-2 min-w-60 shadow-xl">
                    <div className="px-4 py-3 text-white/60 text-sm font-opensans border-b border-white/10">
                      <div className="font-medium text-white/80">Signed in as</div>
                      <div className="truncate">{userEmail}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-white/70 hover:text-white hover:bg-white/5 transition-colors duration-200 flex items-center gap-3 font-opensans text-sm"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/user">
                <button className="flex items-center gap-3 text-white/70 hover:text-white font-opensans text-base font-medium bg-white/5 hover:bg-white/10 px-6 py-3 rounded-lg border border-white/10 transition-all duration-200">
                  <User size={20} />
                  <span>Sign In</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default NavBar