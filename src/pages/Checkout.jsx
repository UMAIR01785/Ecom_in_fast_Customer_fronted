import { useEffect, useRef, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { checkout } from "../api/orders"
import { getErrorMessage } from "../api/client"

export default function Checkout() {
  const { cart, clearCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [address, setAddress] = useState(() => ({
    full_name: user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "",
    phone_number: user?.phone_number ?? "",
    address_line1: user?.address ?? "",
    address_line2: "",
    city: user?.city ?? "",
    state: "",
    postal_code: "",
    country: "Pakistan",
    landmark: "",
  }))
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const prefilledRef = useRef(false)

  useEffect(() => {
    if (!user || prefilledRef.current) return
    prefilledRef.current = true
    setAddress((prev) => ({
      ...prev,
      full_name: prev.full_name || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
      phone_number: prev.phone_number || user.phone_number || "",
      address_line1: prev.address_line1 || user.address || "",
      city: prev.city || user.city || "",
    }))
  }, [user])

  function handleAddressChange(e) {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?returnTo=/cart" replace />
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="page pd-page">
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-current">Checkout</span>
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
          <p>Add some products before checking out.</p>
          <Link to="/shop" className="sc-empty-btn">Start Shopping</Link>
        </div>
      </main>
    )
  }

  const totalItems = cart.items.reduce((s, i) => s + i.quantity, 0)

  async function handleCheckout(e) {
    e.preventDefault()
    setError("")

    const orderAddress = {
      full_name: address.full_name.trim(),
      phone_number: address.phone_number.trim(),
      address_line1: address.address_line1.trim(),
      address_line2: address.address_line2.trim() || null,
      city: address.city.trim(),
      state: address.state.trim() || null,
      postal_code: address.postal_code.trim() || null,
      country: address.country.trim(),
      landmark: address.landmark.trim() || null,
    }

    if (!orderAddress.full_name) {
      setError("Please enter the full name for delivery.")
      return
    }
    if (orderAddress.phone_number.length < 7) {
      setError("Please enter a valid phone number.")
      return
    }
    if (orderAddress.address_line1.length < 5) {
      setError("Please enter a valid street address (at least 5 characters).")
      return
    }
    if (!orderAddress.city) {
      setError("Please enter your city.")
      return
    }
    if (!orderAddress.country) {
      setError("Please enter your country.")
      return
    }

    setLoading(true)
    try {
      const data = await checkout(orderAddress, paymentMethod)

      // Card payment → Stripe redirects to the payment session page
      if (data.payment_url) {
        window.location.href = data.payment_url
        return
      }

      // Cash on delivery → order is already confirmed
      const orderId = data.order?.id ?? data.id
      if (!orderId) {
        navigate("/orders")
        return
      }
      navigate(`/orders/${orderId}`)
      clearCart().catch(() => {})
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page pd-page">
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <Link to="/cart">Cart</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">Checkout</span>
      </div>

      <div className="sc-title-row">
        <h1 className="pd-name" style={{ marginBottom: 0 }}>Checkout</h1>
      </div>

      {error && <div className="sc-error">{error}</div>}

      <div className="sc-layout">
        <div>
          <div className="profile-card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border-light)" }}>
              Shipping Address
            </h2>
            <form onSubmit={handleCheckout}>
              <div className="form-grid" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={address.full_name}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone_number">Phone Number</label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="03001234567"
                    value={address.phone_number}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="address_line1">Street Address</label>
                  <input
                    id="address_line1"
                    name="address_line1"
                    type="text"
                    placeholder="House 12, Street 4, Sector G-11"
                    value={address.address_line1}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="address_line2">Apartment, suite, etc. (optional)</label>
                  <input
                    id="address_line2"
                    name="address_line2"
                    type="text"
                    placeholder="Apartment 3B"
                    value={address.address_line2}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Islamabad"
                    value={address.city}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State / Province (optional)</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="Islamabad Capital Territory"
                    value={address.state}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postal_code">Postal Code (optional)</label>
                  <input
                    id="postal_code"
                    name="postal_code"
                    type="text"
                    placeholder="44000"
                    value={address.postal_code}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    placeholder="Pakistan"
                    value={address.country}
                    onChange={handleAddressChange}
                    required
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="landmark">Landmark (optional)</label>
                  <input
                    id="landmark"
                    name="landmark"
                    type="text"
                    placeholder="Near City Mart"
                    value={address.landmark}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Payment Method</label>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  {[
                    { value: "cod", label: "Cash on Delivery", icon: "💵" },
                    { value: "card", label: "Pay by Card", icon: "💳" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      aria-pressed={paymentMethod === method.value}
                      style={{
                        flex: 1,
                        padding: "14px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: `2px solid ${
                          paymentMethod === method.value
                            ? "var(--primary, #4f46e5)"
                            : "var(--border)"
                        }`,
                        background:
                          paymentMethod === method.value
                            ? "var(--primary-50, #eef2ff)"
                            : "var(--white)",
                        color: "var(--text)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "var(--transition)",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ fontSize: "1.2rem" }}>{method.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", marginTop: 4 }}>
                        {method.label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {method.value === "cod"
                          ? "Pay when you receive"
                          : "Secure payment via Stripe"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={loading}
              >
                {loading
                  ? paymentMethod === "card"
                    ? "Redirecting to Payment..."
                    : "Placing Order..."
                  : paymentMethod === "card"
                    ? "Pay Now"
                    : "Place Order"}
              </button>
            </form>
          </div>
        </div>

        <div className="sc-summary">
          <h2 className="sc-summary-title">Order Summary</h2>

          {cart.items.map((item) => (
            <div key={item.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid var(--border-light)",
              fontSize: "0.9rem",
            }}>
              {item.product.image ? (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: "var(--radius-sm)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  fontSize: "1rem",
                  flexShrink: 0,
                }}>
                  {item.product.name?.[0] || "?"}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.product.name}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  Qty: {item.quantity} x Rs {Number(item.product.price).toFixed(2)}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>
                Rs {Number(item.item_total).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="sc-divider" />

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

          <Link to="/cart" className="sc-continue-link">
            &larr; Back to Cart
          </Link>
        </div>
      </div>
    </main>
  )
}
