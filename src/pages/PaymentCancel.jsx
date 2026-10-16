import { Link } from "react-router-dom"

export default function PaymentCancel() {
  return (
    <main className="page pd-page">
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">Payment</span>
      </div>

      <div className="sc-empty-card">
        <div className="sc-empty-icon-wrap" style={{ color: "#dc2626" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2>Payment Cancelled</h2>
        <p>Your payment was not completed. No charge was made — your cart is still saved.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          <Link to="/checkout" className="sc-empty-btn">Try Again</Link>
          <Link to="/cart" className="sc-empty-btn" style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)" }}>
            Back to Cart
          </Link>
        </div>
      </div>
    </main>
  )
}
