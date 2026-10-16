import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { getOrders } from "../api/orders"

export default function PaymentSuccess() {
  const { fetchCart } = useCart()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [orderId, setOrderId] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    // The Stripe webhook builds the order from the cart and then clears it.
    // We must NOT delete the cart here — only resync local state.
    fetchCart().catch(() => {})

    async function waitForOrder() {
      for (let attempt = 0; attempt < 6; attempt++) {
        if (cancelled) return
        try {
          const orders = await getOrders()
          if (cancelled) return
          if (orders.length > 0) {
            setOrderId(orders[0].id)
            setChecking(false)
            fetchCart().catch(() => {})
            return
          }
        } catch {
          // Not signed in / orders not readable — stop after retries
        }
        await new Promise((r) => setTimeout(r, 1500))
      }
      if (!cancelled) setChecking(false)
    }

    waitForOrder()
    return () => {
      cancelled = true
    }
  }, [fetchCart])

  return (
    <main className="page pd-page">
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">Payment</span>
      </div>

      <div className="sc-empty-card">
        <div className="sc-empty-icon-wrap" style={{ color: "#16a34a" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2>Payment Successful</h2>
        <p>Thank you! Your payment was received and your order is confirmed.</p>

        {checking ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Confirming your order…
          </p>
        ) : orderId ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Order #{orderId} has been created.
          </p>
        ) : (
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Your order will appear in My Orders shortly.
          </p>
        )}

        {sessionId && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
            Session: {sessionId}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          {orderId ? (
            <Link to={`/orders/${orderId}`} className="sc-empty-btn">View Order</Link>
          ) : (
            <Link to="/orders" className="sc-empty-btn">View My Orders</Link>
          )}
          <Link to="/" className="sc-empty-btn" style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}
