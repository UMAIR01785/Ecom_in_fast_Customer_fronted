import { useEffect, useState } from "react"
import { Link, Navigate, useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useOrderSocket } from "../context/OrderSocketContext"
import { getOrder, cancelOrder } from "../api/orders"
import { getReceipt } from "../api/payments"
import { requestRefund, getMyRefunds } from "../api/refunds"
import { getErrorMessage } from "../api/client"

const STATUS_COLORS = {
  pending: { bg: "#fef3c7", text: "#92400e" },
  confirmed: { bg: "#dbeafe", text: "#1e40af" },
  processing: { bg: "#e0e7ff", text: "#3730a3" },
  shipped: { bg: "#d1fae5", text: "#065f46" },
  delivered: { bg: "#dcfce7", text: "#166534" },
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
}

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
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
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  processing: "Processing",
  completed: "Refunded",
  failed: "Failed",
}

export default function OrderDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { subscribe } = useOrderSocket()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptError, setReceiptError] = useState("")
  const [refund, setRefund] = useState(null)
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState("")
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [refundError, setRefundError] = useState("")

  async function handleViewReceipt() {
    if (!order?.payment?.id) return
    setReceiptLoading(true)
    setReceiptError("")
    setReceipt(null)
    try {
      const data = await getReceipt(order.payment.id)
      setReceipt(data)
    } catch (err) {
      setReceiptError(getErrorMessage(err))
    } finally {
      setReceiptLoading(false)
    }
  }

  useEffect(() => {
    return subscribe((message) => {
      if (message?.event !== "order_status_updated") return

      const { order_id: orderId, status } = message.data || {}
      if (String(orderId) !== String(id)) return

      if (status === "cancelled") {
        navigate("/orders")
        return
      }

      setOrder((prev) => (prev ? { ...prev, status } : prev))
    })
  }, [subscribe, id, navigate])

  useEffect(() => {
    let cancelled = false
    async function fetchOrder() {
      try {
        const data = await getOrder(id)
        if (!cancelled) {
          if (data.status === "cancelled") {
            navigate("/orders")
          } else {
            setOrder(data)
          }
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchOrder()
    return () => { cancelled = true }
  }, [id, navigate])

  useEffect(() => {
    let cancelled = false
    async function fetchRefund() {
      try {
        const data = await getMyRefunds()
        if (cancelled) return
        const match = data.find((r) => String(r.order_id) === String(id))
        setRefund(match || null)
      } catch {
        if (!cancelled) setRefund(null)
      }
    }
    fetchRefund()
    return () => { cancelled = true }
  }, [id])

  if (!isAuthenticated) {
    return <Navigate to="/login?returnTo=/orders" replace />
  }

  if (loading) {
    return (
      <main className="page pd-page">
        <div className="loading">Loading order details...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page pd-page">
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <Link to="/orders">My Orders</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-current">Error</span>
        </div>
        <div className="sc-empty-card">
          <div className="alert alert-error">{error}</div>
          <Link to="/orders" className="sc-empty-btn" style={{ marginTop: 16 }}>Back to Orders</Link>
        </div>
      </main>
    )
  }

  if (!order) return null

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this order?")) return
    setCancelling(true)
    try {
      await cancelOrder(order.id)
      navigate("/orders")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  async function handleRefundSubmit(e) {
    e.preventDefault()
    const reason = refundReason.trim()
    if (reason.length < 5) {
      setRefundError("Please give a reason of at least 5 characters")
      return
    }
    setRefundSubmitting(true)
    setRefundError("")
    try {
      const created = await requestRefund(order.id, reason)
      setRefund(created)
      setRefundOpen(false)
      setRefundReason("")
    } catch (err) {
      setRefundError(getErrorMessage(err))
    } finally {
      setRefundSubmitting(false)
    }
  }

  const style = STATUS_COLORS[order.status] || STATUS_COLORS.pending
  const shipping = order.shipping_address
  const itemTotal = order.items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  )

  return (
    <main className="page pd-page">
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <Link to="/orders">My Orders</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">Order #{order.id}</span>
      </div>

      <div className="sc-title-row" style={{ alignItems: "center" }}>
        <h1 className="pd-name" style={{ marginBottom: 0 }}>Order #{order.id}</h1>
        <span style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: 999,
          fontSize: "0.85rem",
          fontWeight: 600,
          background: style.bg,
          color: style.text,
          textTransform: "capitalize",
        }}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
        {order.payment?.id && (
          <button
            onClick={handleViewReceipt}
            disabled={receiptLoading}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "#eff6ff",
              color: "#1e40af",
              border: "1px solid #bfdbfe",
              cursor: receiptLoading ? "not-allowed" : "pointer",
              opacity: receiptLoading ? 0.6 : 1,
            }}
          >
            {receiptLoading ? "Loading..." : "View Receipt"}
          </button>
        )}
        {order.status === "pending" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              marginLeft: "auto",
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              cursor: cancelling ? "not-allowed" : "pointer",
              opacity: cancelling ? 0.6 : 1,
            }}
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
        {order.status === "delivered" && order.payment && !refund && (
          <button
            onClick={() => setRefundOpen(true)}
            style={{
              marginLeft: "auto",
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "#eef2ff",
              color: "#3730a3",
              border: "1px solid #c7d2fe",
              cursor: "pointer",
            }}
          >
            Request Refund
          </button>
        )}
      </div>

      <div className="sc-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="profile-card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-light)" }}>
              Order Info
            </h2>
            <div className="profile-fields">
              <div className="profile-field">
                <span className="profile-field-label">Order ID</span>
                <span className="profile-field-value">#{order.id}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Placed On</span>
                <span className="profile-field-value">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Status</span>
                <span className="profile-field-value" style={{ textTransform: "capitalize" }}>
                  {order.status}
                </span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Payment Status</span>
                <span className="profile-field-value">
                  {order.payment?.status ? (
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: (PAYMENT_STATUS_COLORS[order.payment.status] || {}).bg || "#f1f5f9",
                      color: (PAYMENT_STATUS_COLORS[order.payment.status] || {}).text || "#475569",
                      textTransform: "capitalize",
                    }}>
                      {order.payment.status}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </div>
          </div>

          {refund && (
            <div className="profile-card">
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-light)" }}>
                Refund
              </h2>
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="profile-field-label">Status</span>
                  <span className="profile-field-value">
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: (REFUND_STATUS_COLORS[refund.status] || REFUND_STATUS_COLORS.requested).bg,
                      color: (REFUND_STATUS_COLORS[refund.status] || REFUND_STATUS_COLORS.requested).text,
                      textTransform: "capitalize",
                    }}>
                      {REFUND_STATUS_LABELS[refund.status] || refund.status}
                    </span>
                  </span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Amount</span>
                  <span className="profile-field-value">Rs {Number(refund.amount).toFixed(2)}</span>
                </div>
                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <span className="profile-field-label">Reason</span>
                  <span className="profile-field-value">{refund.reason}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Requested On</span>
                  <span className="profile-field-value">
                    {new Date(refund.requested_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {refund.reviewed_at && (
                  <div className="profile-field">
                    <span className="profile-field-label">Reviewed On</span>
                    <span className="profile-field-value">
                      {new Date(refund.reviewed_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {refund.completed_at && (
                  <div className="profile-field">
                    <span className="profile-field-label">Refunded On</span>
                    <span className="profile-field-value">
                      {new Date(refund.completed_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {refund.admin_note && (
                  <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                    <span className="profile-field-label">Admin Note</span>
                    <span className="profile-field-value">{refund.admin_note}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="profile-card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-light)" }}>
              Shipping Address
            </h2>
            {shipping && typeof shipping === "object" ? (
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="profile-field-label">Recipient</span>
                  <span className="profile-field-value">{shipping.full_name}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Phone</span>
                  <span className="profile-field-value">{shipping.phone_number}</span>
                </div>
                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <span className="profile-field-label">Address</span>
                  <span className="profile-field-value">
                    {shipping.address_line1}
                    {shipping.address_line2 ? `, ${shipping.address_line2}` : ""}
                  </span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">City</span>
                  <span className="profile-field-value">{shipping.city}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">State / Province</span>
                  <span className="profile-field-value">{shipping.state || "—"}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Postal Code</span>
                  <span className="profile-field-value">{shipping.postal_code || "—"}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Country</span>
                  <span className="profile-field-value">{shipping.country}</span>
                </div>
                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <span className="profile-field-label">Landmark</span>
                  <span className="profile-field-value">{shipping.landmark || "—"}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
                {shipping || "No shipping address"}
              </p>
            )}
          </div>
        </div>

        <div className="sc-summary">
          <h2 className="sc-summary-title">Order Items</h2>

          {order.items.map((item) => (
            <div key={item.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid var(--border-light)",
              fontSize: "0.9rem",
            }}>
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_name || "Product"}
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
                  {item.product_name?.[0] || "?"}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.product_name || `Product #${item.product_id}`}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  Qty: {item.quantity} x Rs {Number(item.unit_price).toFixed(2)}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>
                Rs {(Number(item.unit_price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="sc-divider" />

          <div className="sc-summary-row">
            <span>Subtotal ({order.items.length} items)</span>
            <span>Rs {itemTotal.toFixed(2)}</span>
          </div>

          <div className="sc-summary-row">
            <span>Shipping</span>
            <span className="sc-free">Free</span>
          </div>

          <div className="sc-divider" />

          <div className="sc-summary-row sc-total">
            <span>Total</span>
            <span>Rs {Number(order.total_amount).toFixed(2)}</span>
          </div>

          <Link to="/orders" className="sc-continue-link" style={{ marginTop: 16 }}>
            &larr; Back to Orders
          </Link>
        </div>
      </div>

      {(receipt || receiptLoading || receiptError) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => !receiptLoading && setReceipt(null)}
        >
          <div
            className="profile-card"
            style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-light)" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Payment Receipt
              </h2>
              <button
                className="admin-action-btn"
                title="Close"
                onClick={() => setReceipt(null)}
                disabled={receiptLoading}
              >
                &#10005;
              </button>
            </div>

            {receiptLoading ? (
              <div className="admin-table-empty">
                <div className="admin-loading-spinner" />
                <p>Loading receipt...</p>
              </div>
            ) : receiptError ? (
              <div className="alert alert-error">{receiptError}</div>
            ) : receipt ? (
              <div>
                <div className="profile-fields">
                  <div className="profile-field">
                    <span className="profile-field-label">Receipt #</span>
                    <span className="profile-field-value">#{receipt.payment_id}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Order</span>
                    <span className="profile-field-value">#{receipt.order_id}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Customer</span>
                    <span className="profile-field-value">
                      {receipt.customer_name} ({receipt.customer_email})
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Ship To</span>
                    <span className="profile-field-value">{receipt.shipping_address}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Method</span>
                    <span className="profile-field-value" style={{ textTransform: "capitalize" }}>
                      {receipt.payment_method}
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Status</span>
                    <span className="profile-field-value" style={{ textTransform: "capitalize" }}>
                      {receipt.payment_status}
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Transaction ID</span>
                    <span className="profile-field-value" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                      {receipt.transaction_id || "—"}
                    </span>
                  </div>
                  {receipt.paid_at && (
                    <div className="profile-field">
                      <span className="profile-field-label">Paid On</span>
                      <span className="profile-field-value">
                        {new Date(receipt.paid_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="sc-divider" />

                <div className="sc-summary-title" style={{ marginBottom: 8 }}>Items</div>
                {receipt.items.map((item) => (
                  <div
                    key={item.product_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border-light)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span style={{ color: "var(--text)" }}>
                      {item.product_name}{" "}
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        x {item.quantity}
                      </span>
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      Rs {Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="sc-summary-row sc-total" style={{ marginTop: 12 }}>
                  <span>Total</span>
                  <span>Rs {Number(receipt.amount).toFixed(2)}</span>
                </div>

                {receipt.receipt_url && (
                  <a
                    href={receipt.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="sc-empty-btn"
                    style={{ marginTop: 16, display: "block", textAlign: "center" }}
                  >
                    Open Full Receipt
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {refundOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => !refundSubmitting && setRefundOpen(false)}
        >
          <form
            className="profile-card"
            style={{ width: "100%", maxWidth: 480 }}
            onSubmit={handleRefundSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border-light)" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Request Refund
              </h2>
              <button
                type="button"
                className="admin-action-btn"
                title="Close"
                onClick={() => setRefundOpen(false)}
                disabled={refundSubmitting}
              >
                &#10005;
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginTop: 0 }}>
              Refund for Order #{order.id} &middot; Rs {Number(order.total_amount).toFixed(2)}
            </p>

            <label
              htmlFor="refund-reason"
              style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: 8 }}
            >
              Reason
            </label>
            <textarea
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell us why you want a refund (min. 5 characters)"
              disabled={refundSubmitting}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-light)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />

            {refundError && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                {refundError}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                type="button"
                className="sc-empty-btn"
                onClick={() => setRefundOpen(false)}
                disabled={refundSubmitting}
                style={{ marginTop: 0 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="sc-empty-btn"
                disabled={refundSubmitting}
                style={{
                  marginTop: 0,
                  background: "#4f46e5",
                  color: "#fff",
                  border: "1px solid #4f46e5",
                  cursor: refundSubmitting ? "not-allowed" : "pointer",
                  opacity: refundSubmitting ? 0.6 : 1,
                }}
              >
                {refundSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
