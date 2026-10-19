import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useOrderSocket } from "../context/OrderSocketContext"
import { getOrders } from "../api/orders"
import { getMyRefunds } from "../api/refunds"
import { getErrorMessage } from "../api/client"
import { addressLine } from "../utils/orderAddress"

const STATUS_COLORS = {
  pending: { bg: "#fef3c7", text: "#92400e" },
  confirmed: { bg: "#dbeafe", text: "#1e40af" },
  processing: { bg: "#e0e7ff", text: "#3730a3" },
  shipped: { bg: "#d1fae5", text: "#065f46" },
  delivered: { bg: "#dcfce7", text: "#166534" },
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
}

const PAYMENT_STATUS_COLORS = {
  pending: { bg: "#fef3c7", text: "#92400e" },
  paid: { bg: "#dcfce7", text: "#166534" },
  failed: { bg: "#fee2e2", text: "#991b1b" },
  refunded: { bg: "#e0e7ff", text: "#3730a3" },
}

const REFUND_STATUS_COLORS = {
  requested: { bg: "#fef3c7", text: "#92400e" },
  approved: { bg: "#dbeafe", text: "#1e40af" },
  rejected: { bg: "#fee2e2", text: "#991b1b" },
  processing: { bg: "#e0e7ff", text: "#3730a3" },
  completed: { bg: "#dcfce7", text: "#166534" },
  failed: { bg: "#fee2e2", text: "#991b1b" },
}

const REFUND_STATUS_LABELS = {
  requested: "Refund Requested",
  approved: "Refund Approved",
  rejected: "Refund Rejected",
  processing: "Refund Processing",
  completed: "Refunded",
  failed: "Refund Failed",
}

export default function Orders() {
  const { isAuthenticated } = useAuth()
  const { subscribe } = useOrderSocket()
  const [orders, setOrders] = useState([])
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const refundByOrder = new Map(
    refunds.map((r) => [String(r.order_id), r])
  )

  useEffect(() => {
    return subscribe((message) => {
      if (message?.event !== "order_status_updated") return

      const { order_id: orderId, status } = message.data || {}

      setOrders((prev) => {
        if (status === "cancelled") {
          return prev.filter((o) => o.id !== orderId)
        }
        return prev.map((o) =>
          o.id === orderId ? { ...o, status } : o
        )
      })
    })
  }, [subscribe])

  useEffect(() => {
    let cancelled = false
    async function fetchOrders() {
      try {
        const [ordersData, refundsData] = await Promise.all([
          getOrders(),
          getMyRefunds().catch(() => []),
        ])
        if (cancelled) return
        setOrders(ordersData.filter((o) => o.status !== "cancelled"))
        setRefunds(refundsData)
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchOrders()
    return () => { cancelled = true }
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login?returnTo=/orders" replace />
  }

  if (loading) {
    return (
      <main className="page pd-page">
        <div className="loading">Loading your orders...</div>
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
        <span className="pd-breadcrumb-current">My Orders</span>
      </div>

      <div className="sc-title-row">
        <h1 className="pd-name" style={{ marginBottom: 0 }}>My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="sc-empty-card">
          <div className="sc-empty-icon-wrap">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h2>No orders yet</h2>
          <p>Start shopping to place your first order.</p>
          <Link to="/shop" className="sc-empty-btn">Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {orders.map((order) => {
            const style = STATUS_COLORS[order.status] || STATUS_COLORS.pending
            const paymentStatus = order.payment?.status
            const paymentStyle = PAYMENT_STATUS_COLORS[paymentStatus]
            const refund = refundByOrder.get(String(order.id))
            const refundStyle = refund
              ? REFUND_STATUS_COLORS[refund.status] || REFUND_STATUS_COLORS.requested
              : null
            return (
              <div
                key={order.id}
                className="profile-card"
                style={{ padding: 0, cursor: "pointer", transition: "box-shadow 0.2s" }}
                onClick={() => navigate(`/orders/${order.id}`)}
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
                      Order #{order.id}
                    </span>
                    <span style={{
                      marginLeft: 12,
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                    }}>
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
                      {order.status}
                    </span>
                    {paymentStatus && (
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background: paymentStyle?.bg || "#f1f5f9",
                        color: paymentStyle?.text || "#475569",
                        textTransform: "capitalize",
                      }}>
                        Payment: {paymentStatus}
                      </span>
                    )}
                    {refund && (
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: 999,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background: refundStyle.bg,
                        color: refundStyle.text,
                      }}>
                        {REFUND_STATUS_LABELS[refund.status] || `Refund: ${refund.status}`}
                      </span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)" }}>
                      Rs {Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "12px 24px" }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      fontSize: "0.9rem",
                    }}>
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name || "Product"}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: "var(--radius-sm)",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: "var(--radius-sm)",
                          background: "var(--border-light)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          flexShrink: 0,
                        }}>
                          {item.product_name?.[0] || "?"}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.product_name || `Product #${item.product_id}`}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          Qty: {item.quantity} &times; Rs {Number(item.unit_price).toFixed(2)}
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--text)", flexShrink: 0 }}>
                        Rs {(Number(item.unit_price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: "12px 24px",
                  borderTop: "1px solid var(--border-light)",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                }}>
                  <strong style={{ color: "var(--text)" }}>Shipping:</strong> {addressLine(order.shipping_address) || "—"}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
