import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate("/login")
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          ShopSphere
        </Link>

        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span style={menuOpen ? { transform: "rotate(45deg) translate(5px, 5px)" } : {}} />
          <span style={menuOpen ? { opacity: 0 } : {}} />
          <span style={menuOpen ? { transform: "rotate(-45deg) translate(5px, -5px)" } : {}} />
        </button>

        <div className={`navbar-links${menuOpen ? " open" : ""}`}>
          <Link to="/" className="navbar-link" onClick={closeMenu}>
            Home
          </Link>
          <Link to="/shop" className="navbar-link" onClick={closeMenu}>
            Shop
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="navbar-link" onClick={closeMenu}>
                Orders
              </Link>
              <Link to="/refunds" className="navbar-link" onClick={closeMenu}>
                Refunds
              </Link>
              <Link to="/profile" className="navbar-link" onClick={closeMenu}>
                Profile
              </Link>
              <Link to="/cart" className="navbar-link navbar-cart" onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {itemCount > 0 && (
                  <span className="navbar-cart-badge">{itemCount}</span>
                )}
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/cart" className="navbar-link navbar-cart" onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {itemCount > 0 && (
                  <span className="navbar-cart-badge">{itemCount}</span>
                )}
              </Link>
              <Link to="/login" className="navbar-link" onClick={closeMenu}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
