import { useState } from "react"
import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { getErrorMessage } from "../api/client"

export default function Cart() {
  const { cart, loading, updateCartItem, removeFromCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [error, setError] = useState("")
  const [promo, setPromo] = useState("")
  const [removing, setRemoving] = useState(null)
  const [updating, setUpdating] = useState(null)

  async function changeQty(pid, qty) {
    if (qty < 1) return
    setUpdating(pid)
    setError("")
    try { await updateCartItem(pid, qty) }
    catch (e) { setError(getErrorMessage(e)) }
    finally { setUpdating(null) }
  }

  async function removeItem(pid) {
    setRemoving(pid)
    setError("")
    try { await removeFromCart(pid) }
    catch (e) { setError(getErrorMessage(e)) }
    finally { setRemoving(null) }
  }

  if (loading) {
    return (
      <main className="page pd-page">
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-current">Cart</span>
        </div>
        <div className="sc-loading-grid">
          {[1,2,3].map(i => (
            <div key={i} className="sc-loading-item">
              <div className="sc-loading-img" />
              <div className="sc-loading-lines">
                <div className="sc-loading-line w50" />
                <div className="sc-loading-line w30" />
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="page pd-page">
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-current">Cart</span>
        </div>
        <div className="sc-empty-card">
          <div className="sc-empty-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven&apos;t added any products yet.</p>
          <Link to="/shop" className="sc-empty-btn">Start Shopping</Link>
        </div>
      </main>
    )
  }

  const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <main className="page pd-page">
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">Cart</span>
      </div>

      <div className="sc-title-row">
        <h1 className="pd-name" style={{ marginBottom: 0 }}>Shopping Cart</h1>
        <span className="sc-item-count">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
      </div>

      {error && <div className="sc-error">{error}</div>}

      <div className="sc-layout">
        <div className="sc-items">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className={`sc-item ${removing === item.product_id ? "sc-item-out" : ""}`}
            >
              <Link
                to={item.product.category_slug ? `/${item.product.category_slug}/${item.product.slug}` : "/shop"}
                className="sc-item-img"
              >
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} />
                ) : (
                  <div className="sc-item-img-fallback">{item.product.name[0]}</div>
                )}
              </Link>

              <div className="sc-item-details">
                <Link
                  to={item.product.category_slug ? `/${item.product.category_slug}/${item.product.slug}` : "/shop"}
                  className="sc-item-name"
                >
                  {item.product.name}
                </Link>
                <span className="sc-item-price-unit">Rs {Number(item.product.price).toFixed(2)} each</span>

                <div className="sc-item-bottom">
                  <div className="sc-qty">
                    <button
                      className="sc-qty-btn"
                      onClick={() => changeQty(item.product_id, item.quantity - 1)}
                      disabled={updating === item.product_id || item.quantity <= 1}
                    >&#8722;</button>
                    <span className="sc-qty-val">{item.quantity}</span>
                    <button
                      className="sc-qty-btn"
                      onClick={() => changeQty(item.product_id, item.quantity + 1)}
                      disabled={updating === item.product_id}
                    >+</button>
                  </div>

                  <span className="sc-item-subtotal">Rs {Number(item.item_total).toFixed(2)}</span>
                </div>
              </div>

              <button
                className="sc-item-remove"
                onClick={() => removeItem(item.product_id)}
                disabled={removing === item.product_id}
                title="Remove"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="sc-summary">
          <h2 className="sc-summary-title">Order Summary</h2>

          <div className="sc-summary-row">
            <span>Subtotal ({totalItems} items)</span>
            <span>Rs {Number(cart.subtotal).toFixed(2)}</span>
          </div>

          <div className="sc-summary-row">
            <span>Shipping</span>
            <span className="sc-free">Free</span>
          </div>

          <div className="sc-divider" />

          <div className="sc-summary-row sc-total">
            <span>Total</span>
            <span>Rs {Number(cart.subtotal).toFixed(2)}</span>
          </div>

          <div className="sc-promo">
            <input
              type="text"
              placeholder="Coupon code"
              value={promo}
              onChange={e => setPromo(e.target.value)}
            />
            <button className="sc-promo-btn">Apply</button>
          </div>

          <Link
            to={isAuthenticated ? "/checkout" : "/login?returnTo=/cart"}
            className="sc-checkout-btn"
            style={{ display: "block", textAlign: "center", textDecoration: "none" }}
          >
            {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
          </Link>

          <Link to="/shop" className="sc-continue-link">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}
