import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getMyRefunds } from "../api/refunds"
import { getErrorMessage } from "../api/client"

const STATUS_COLORS = {
  requested: { bg: "#fef3c7", text: "#92400e" },
  approved: { bg: "#dbeafe", text: "#1e40af" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  processing: { bg: "#e0e7ff", text: "#3730a3" },
  completed: { bg: "#dcfce7", text: "#166534" },
  failed: { bg: "#fee2e2", text: "#991b1b" },
}

const STATUS_LABELS = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  processing: "Processing",
  completed: "Refunded",
  failed: "Failed",
}

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function Refunds() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function fetchRefunds() {
      try {
        const data = await getMyRefunds()
        if (!cancelled) setRefunds(data)
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRefunds()
    return () => { cancelled = true }
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login?returnTo=/refunds" replace />
  }

  if (loading) {
    return (
      <main className="page pd-page">
        <div className="loading">Loading your refund requests...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page pd-page">
        <div className="sc-empty-card">
          <div className="alert alert-error">{error}</div>
          <Link to="/" className="sc-empty-btn" style={{ marginTop: 16 }}>Back to Home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page pd-page">
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">My Refunds</span>
      </div>

      <div className="sc-title-row">
        <h1 className="pd-name" style={{ marginBottom: 0 }}>My Refunds</h1>
      </div>

      {refunds.length === 0 ? (
        <div className="sc-empty-card">
          <div className="sc-empty-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h2>No refund requests</h2>
          <p>You haven't requested any refunds yet. Refunds can be requested from a delivered order.</p>
          <Link to="/orders" className="sc-empty-btn">Go to My Orders</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {refunds.map((refund) => {
            const style = STATUS_COLORS[refund.status] || STATUS_COLORS.requested
            return (
              <div
                key={refund.id}
                className="profile-card"
                style={{ padding: 0, cursor: "pointer", transition: "box-shadow 0.2s" }}
                onClick={() => navigate(`/orders/${refund.order_id}`)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--border-light)",
                  flexWrap: "wrap",
                  gap: 12,
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text)", fontSize: "1rem" }}>
                      Refund #{refund.id}
                    </span>
                    <span style={{
                      marginLeft: 12,
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}>
                      Order #{refund.order_id}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: style.bg,
                      color: style.text,
                      textTransform: "capitalize",
                    }}>
                      {STATUS_LABELS[refund.status] || refund.status}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)" }}>
                      Rs {Number(refund.amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "16px 24px" }}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Reason
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5 }}>
                      {refund.reason}
                    </p>
                  </div>

                  {refund.admin_note && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Admin Note
                      </span>
                      <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5 }}>
                        {refund.admin_note}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <span>Requested: {formatDate(refund.requested_at)}</span>
                    {refund.reviewed_at && <span>Reviewed: {formatDate(refund.reviewed_at)}</span>}
                    {refund.completed_at && <span>Refunded: {formatDate(refund.completed_at)}</span>}
                  </div>
                </div>

                <div style={{
                  padding: "12px 24px",
                  borderTop: "1px solid var(--border-light)",
                  fontSize: "0.85rem",
                }}>
                  <Link
                    to={`/orders/${refund.order_id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}
                  >
                    View Order &rarr;
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
