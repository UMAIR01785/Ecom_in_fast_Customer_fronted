import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  sendShoppingChatMessage,
  checkoutShoppingChat,
} from "../api/shoppingChat"
import { getCart } from "../api/cart"
import { getErrorMessage } from "../api/client"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"

const MAX_QUANTITY = 10

const QUICK_PROMPTS = [
  "Show me running shoes",
  "Any sneakers on sale?",
  "Help me pick a gift",
]

const GREETING = {
  id: "local-greeting",
  role: "assistant",
  content:
    "Hi! I'm your shopping assistant. Ask me about products, sizes, colors, or prices — I'll find real items from the store and you can add them to your cart right here.",
  products: [],
  created_at: null,
}

function formatPrice(value) {
  if (value == null) return null
  return `Rs ${Number(value).toFixed(2)}`
}

function ProductCard({ product, onCheckout }) {
  const { addToCart } = useCart()

  const variants = Array.isArray(product.variants) ? product.variants : []
  const hasVariants = variants.length > 0

  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))]
  const [pickedColor, setPickedColor] = useState("")
  const [pickedSize, setPickedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [cardError, setCardError] = useState(null)

  const selectedColor = colors.includes(pickedColor) ? pickedColor : colors[0] || ""
  const colorVariants = hasVariants
    ? variants.filter((v) => v.color === selectedColor)
    : []
  const sizes = [...new Set(colorVariants.map((v) => v.size).filter(Boolean))]
  const selectedSize = sizes.includes(pickedSize)
    ? pickedSize
    : (colorVariants.find((v) => v.stock > 0) || colorVariants[0])?.size || ""
  const selectedVariant = hasVariants
    ? colorVariants.find((v) => v.size === selectedSize) || null
    : null

  const unitPrice =
    selectedVariant?.price != null
      ? Number(selectedVariant.price)
      : product.price != null
        ? Number(product.price)
        : null
  const stock = hasVariants ? selectedVariant?.stock ?? null : product.stock
  const maxQty = Math.max(1, Math.min(Number(stock) || 1, MAX_QUANTITY))
  const qty = Math.min(quantity, maxQty)
  const outOfStock = stock != null && stock <= 0
  const needsVariant = hasVariants && !selectedVariant

  async function handleAddToCart() {
    if (adding) return
    setCardError(null)

    if (needsVariant) {
      setCardError("Please select a size and color.")
      return
    }
    if (outOfStock) {
      setCardError("This item is out of stock.")
      return
    }

    setAdding(true)
    try {
      await addToCart(
        product.id,
        qty,
        selectedVariant ? selectedVariant.id : null
      )
      setAdded(true)
    } catch (err) {
      setCardError(err?.message || "Failed to add to cart")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="chat-product-card">
      <div className="chat-product-top">
        {product.image ? (
          <img src={product.image} alt={product.name} className="chat-product-img" />
        ) : (
          <div className="chat-product-img chat-product-img-placeholder">👟</div>
        )}
        <div className="chat-product-info">
          <p className="chat-product-name">{product.name}</p>
          <div className="chat-product-meta">
            {unitPrice != null && (
              <span className="chat-product-price">{formatPrice(unitPrice)}</span>
            )}
            <span
              className={`chat-product-stock${stock == null ? "" : stock > 0 ? " in" : " out"}`}
            >
              {stock == null
                ? "Select size"
                : stock > 0
                  ? `${stock} in stock`
                  : "Out of stock"}
            </span>
          </div>
          {product.description && (
            <p className="chat-product-desc">{product.description}</p>
          )}
        </div>
      </div>

      {hasVariants && (
        <div className="chat-product-variants">
          {colors.length > 0 && (
            <div className="chat-variant-group">
              <span className="chat-variant-label">Color</span>
              <div className="chat-variant-options">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`chat-variant-chip${selectedColor === color ? " active" : ""}`}
                    onClick={() => {
                      setPickedColor(color)
                      setPickedSize("")
                      setAdded(false)
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          {sizes.length > 0 && (
            <div className="chat-variant-group">
              <span className="chat-variant-label">Size</span>
              <div className="chat-variant-options">
                {sizes.map((size) => {
                  const sizeVariant = colorVariants.find((v) => v.size === size)
                  const disabled = !sizeVariant || sizeVariant.stock <= 0
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`chat-variant-chip${selectedSize === size ? " active" : ""}${disabled ? " disabled" : ""}`}
                      disabled={disabled}
                      onClick={() => {
                        setPickedSize(size)
                        setAdded(false)
                      }}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="chat-product-actions">
        <div className="chat-qty">
          <button
            type="button"
            onClick={() => {
              setQuantity((q) => Math.max(1, q - 1))
              setAdded(false)
            }}
            disabled={qty <= 1 || adding}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span>{qty}</span>
          <button
            type="button"
            onClick={() => {
              setQuantity((q) => Math.min(maxQty, q + 1))
              setAdded(false)
            }}
            disabled={qty >= maxQty || adding || outOfStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="chat-add-btn"
          disabled={adding || added || outOfStock || needsVariant}
          onClick={handleAddToCart}
        >
          {adding
            ? "Adding..."
            : added
              ? "Added"
            : outOfStock
              ? "Out of stock"
              : needsVariant
                ? "Select size"
                : "Add to cart"}
        </button>
      </div>

      {cardError && <p className="chat-product-error">{cardError}</p>}

      {added && !cardError && (
        <div className="chat-added-row">
          <span className="chat-added-msg">✓ Added to cart</span>
          <Link to="/cart" className="chat-added-link">
            View cart
          </Link>
          <button
            type="button"
            className="chat-added-link chat-added-checkout"
            onClick={() => onCheckout?.()}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}

const EMPTY_ADDRESS = {
  full_name: "",
  phone_number: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Pakistan",
  landmark: "",
}

function buildOrderAddress(address) {
  return {
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
}

function validateOrderAddress(orderAddress) {
  if (!orderAddress.full_name) return "Please enter the full name for delivery."
  if (orderAddress.phone_number.length < 7)
    return "Please enter a valid phone number."
  if (orderAddress.address_line1.length < 5)
    return "Please enter a valid street address (at least 5 characters)."
  if (!orderAddress.city) return "Please enter your city."
  if (!orderAddress.country) return "Please enter your country."
  return null
}

function formatStatus(status) {
  if (!status) return ""
  const text = String(status).replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function ChatCheckout({ onBack, onOrderPlaced }) {
  const { cart, fetchCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  const [step, setStep] = useState("details") // details | review | success
  const [address, setAddress] = useState(() => ({ ...EMPTY_ADDRESS }))
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [formError, setFormError] = useState(null)
  const [reviewCart, setReviewCart] = useState(null)
  const [reviewAddress, setReviewAddress] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState(null)
  const [ambiguousFailure, setAmbiguousFailure] = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)
  const [redirecting, setRedirecting] = useState(false)
  const prefilledRef = useRef(false)

  useEffect(() => {
    fetchCart().catch(() => {})
  }, [fetchCart])

  useEffect(() => {
    if (!user || prefilledRef.current) return
    prefilledRef.current = true
    setAddress((prev) => ({
      ...prev,
      full_name:
        prev.full_name ||
        `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
      phone_number: prev.phone_number || user.phone_number || "",
      address_line1: prev.address_line1 || user.address || "",
      city: prev.city || user.city || "",
    }))
  }, [user])

  function handleAddressChange(e) {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  async function handleReview(e) {
    e.preventDefault()
    if (reviewLoading) return
    setFormError(null)

    const orderAddress = buildOrderAddress(address)
    const validationError = validateOrderAddress(orderAddress)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setReviewLoading(true)
    try {
      // Always review against the live backend cart — never AI-generated totals.
      const freshCart = await getCart()
      if (!freshCart || !freshCart.items || freshCart.items.length === 0) {
        setReviewCart(null)
        setFormError("Your cart is empty. Add some shoes before checking out.")
        fetchCart().catch(() => {})
        return
      }
      setReviewCart(freshCart)
      setReviewAddress(orderAddress)
      setPlaceError(null)
      setAmbiguousFailure(false)
      setStep("review")
    } catch (err) {
      if (err?.response?.status === 404) {
        setReviewCart(null)
        setFormError("Your cart is empty. Add some shoes before checking out.")
      } else {
        setFormError(getErrorMessage(err))
      }
    } finally {
      setReviewLoading(false)
    }
  }

  // The checkout POST is only sent from the Confirm Order click, with confirmed: true.
  async function handleConfirmOrder() {
    if (placing || ambiguousFailure || !reviewAddress) return

    setPlacing(true)
    setPlaceError(null)
    try {
      const data = await checkoutShoppingChat(reviewAddress, paymentMethod, true)

      const paymentUrl = data?.payment_url || null

      if (paymentUrl) {
        setRedirecting(true)
        window.location.href = paymentUrl
        return
      }

      setSuccessOrder(data?.order || null)
      setStep("success")
      fetchCart().catch(() => {})
      onOrderPlaced?.()
    } catch (err) {
      if (!err?.response) {
        // Ambiguous network failure: the order may already exist — never auto-retry.
        setAmbiguousFailure(true)
        setPlaceError(
          "We couldn't confirm whether your order was placed. Please check your Orders page before trying again."
        )
      } else if (err.response.status === 401) {
        setPlaceError("Your session has expired. Please log in again to place your order.")
      } else {
        setPlaceError(getErrorMessage(err))
      }
    } finally {
      setPlacing(false)
    }
  }

  function handleCancelReview() {
    if (placing) return
    setPlaceError(null)
    setAmbiguousFailure(false)
    setStep("details")
  }

  const returnTo = `${location.pathname}${location.search}`

  if (!isAuthenticated) {
    return (
      <div className="chat-checkout">
        <div className="chat-checkout-bar">
          <button
            type="button"
            className="chat-checkout-back"
            onClick={onBack}
            aria-label="Back to chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <span className="chat-checkout-title">Checkout</span>
        </div>
        <div className="chat-checkout-body">
          <div className="chat-co-login">
            <span className="chat-co-login-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <h3>Please log in to place your order</h3>
            <p>
              You need an account to confirm and pay for your order. Your cart
              will be kept and merged into your account after you log in.
            </p>
            <Link
              to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="chat-co-btn chat-co-btn-primary"
            >
              Log in
            </Link>
            <button
              type="button"
              className="chat-co-btn chat-co-btn-ghost"
              onClick={onBack}
            >
              Back to chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  const cartEmpty = cart != null && (!cart.items || cart.items.length === 0)

  return (
    <div className="chat-checkout">
      <div className="chat-checkout-bar">
        <button
          type="button"
          className="chat-checkout-back"
          onClick={onBack}
          aria-label="Back to chat"
          disabled={placing}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="chat-checkout-title">
          {step === "success" ? "Order Confirmed" : "Checkout"}
        </span>
      </div>

      <div className="chat-checkout-body">
        {step === "success" ? (
          <div className="chat-co-success">
            <div className="chat-co-success-icon">✓</div>
            <h3>
              {paymentMethod === "card"
                ? "Payment submitted"
                : "Order placed!"}
            </h3>
            {successOrder?.id != null && (
              <p>
                Order <span className="chat-co-order-id">#{successOrder.id}</span> has
                been placed.
              </p>
            )}
            {successOrder?.status && (
              <p>
                Status:{" "}
                <span className="chat-co-status">
                  {formatStatus(successOrder.status)}
                </span>
              </p>
            )}
            {successOrder?.total_amount != null && (
              <p className="chat-co-success-total">
                Total: {formatPrice(successOrder.total_amount)}
              </p>
            )}
            {successOrder?.id != null && (
              <Link
                to={`/orders/${successOrder.id}`}
                className="chat-co-btn chat-co-btn-primary"
                onClick={onBack}
              >
                View order
              </Link>
            )}
            <button
              type="button"
              className="chat-co-btn chat-co-btn-ghost"
              onClick={onBack}
            >
              Continue shopping
            </button>
          </div>
        ) : cartEmpty && !reviewCart ? (
          <div className="chat-co-empty">
            <h3>Your cart is empty</h3>
            <p>Add some shoes from the chat, then come back to check out.</p>
            <button
              type="button"
              className="chat-co-btn chat-co-btn-primary"
              onClick={onBack}
            >
              Back to chat
            </button>
          </div>
        ) : step === "details" ? (
          <form onSubmit={handleReview} className="chat-co-form">
            <p className="chat-co-sub">
              Enter your delivery details, then review your order before placing
              it.
            </p>

            {formError && <div className="chat-co-error">{formError}</div>}

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_name">
                Full Name
              </label>
              <input
                id="chat_co_name"
                name="full_name"
                type="text"
                className="chat-co-input"
                placeholder="John Doe"
                value={address.full_name}
                onChange={handleAddressChange}
                required
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_phone">
                Phone Number
              </label>
              <input
                id="chat_co_phone"
                name="phone_number"
                type="tel"
                className="chat-co-input"
                placeholder="03001234567"
                value={address.phone_number}
                onChange={handleAddressChange}
                required
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_address1">
                Street Address
              </label>
              <input
                id="chat_co_address1"
                name="address_line1"
                type="text"
                className="chat-co-input"
                placeholder="House 10, Main Road"
                value={address.address_line1}
                onChange={handleAddressChange}
                required
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_address2">
                Apartment, suite, etc. (optional)
              </label>
              <input
                id="chat_co_address2"
                name="address_line2"
                type="text"
                className="chat-co-input"
                placeholder="Apartment 3B"
                value={address.address_line2}
                onChange={handleAddressChange}
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_city">
                City
              </label>
              <input
                id="chat_co_city"
                name="city"
                type="text"
                className="chat-co-input"
                placeholder="Faisalabad"
                value={address.city}
                onChange={handleAddressChange}
                required
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_state">
                State / Province (optional)
              </label>
              <input
                id="chat_co_state"
                name="state"
                type="text"
                className="chat-co-input"
                placeholder="Punjab"
                value={address.state}
                onChange={handleAddressChange}
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_postal">
                Postal Code (optional)
              </label>
              <input
                id="chat_co_postal"
                name="postal_code"
                type="text"
                className="chat-co-input"
                placeholder="38000"
                value={address.postal_code}
                onChange={handleAddressChange}
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_country">
                Country
              </label>
              <input
                id="chat_co_country"
                name="country"
                type="text"
                className="chat-co-input"
                placeholder="Pakistan"
                value={address.country}
                onChange={handleAddressChange}
                required
              />
            </div>

            <div className="chat-co-field">
              <label className="chat-co-label" htmlFor="chat_co_landmark">
                Landmark (optional)
              </label>
              <input
                id="chat_co_landmark"
                name="landmark"
                type="text"
                className="chat-co-input"
                placeholder="Near City Mart"
                value={address.landmark}
                onChange={handleAddressChange}
              />
            </div>

            <div className="chat-co-field">
              <span className="chat-co-label">Payment Method</span>
              <div className="chat-co-pay">
                {[
                  { value: "cod", label: "Cash on Delivery", hint: "Pay when you receive" },
                  { value: "card", label: "Pay by Card", hint: "Secure payment via Stripe" },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    className={`chat-co-pay-btn${paymentMethod === method.value ? " active" : ""}`}
                    aria-pressed={paymentMethod === method.value}
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <strong>{method.label}</strong>
                    <span>{method.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="chat-co-btn chat-co-btn-primary chat-co-btn-block"
              disabled={reviewLoading}
            >
              {reviewLoading ? "Loading cart..." : "Review Order"}
            </button>

            <button
              type="button"
              className="chat-co-btn chat-co-btn-ghost chat-co-btn-block"
              onClick={onBack}
            >
              Back to chat
            </button>
          </form>
        ) : (
          <div className="chat-co-review">
            <p className="chat-co-sub">
              Review your order below. Nothing is charged until you confirm.
            </p>

            <div className="chat-co-block">
              <div className="chat-co-block-title">Items</div>
              {reviewCart?.items?.map((item) => (
                <div key={item.id} className="chat-co-review-item">
                  {item.product?.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="chat-co-review-img"
                    />
                  ) : (
                    <div className="chat-co-review-img chat-co-review-img-placeholder">
                      {item.product?.name?.[0] || "?"}
                    </div>
                  )}
                  <div className="chat-co-review-info">
                    <p className="chat-co-review-name">{item.product?.name}</p>
                    <p className="chat-co-review-meta">
                      {item.variant
                        ? `${item.variant.size} / ${item.variant.color} · `
                        : ""}
                      Qty: {item.quantity} ×{" "}
                      {formatPrice(item.variant?.price ?? item.product?.price)}
                    </p>
                  </div>
                  <span className="chat-co-review-total">
                    {formatPrice(item.item_total)}
                  </span>
                </div>
              ))}
              <div className="chat-co-summary-row total">
                <span>Subtotal</span>
                <span>{formatPrice(reviewCart?.subtotal)}</span>
              </div>
            </div>

            <div className="chat-co-block">
              <div className="chat-co-block-title">
                Delivery address
                <button
                  type="button"
                  onClick={handleCancelReview}
                  disabled={placing}
                >
                  Change
                </button>
              </div>
              <p>
                {reviewAddress?.full_name}
                <br />
                {reviewAddress?.phone_number}
                <br />
                {reviewAddress?.address_line1}
                {reviewAddress?.address_line2 ? (
                  <>
                    <br />
                    {reviewAddress.address_line2}
                  </>
                ) : null}
                <br />
                {[reviewAddress?.city, reviewAddress?.state, reviewAddress?.postal_code]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {reviewAddress?.country}
                {reviewAddress?.landmark ? (
                  <>
                    <br />
                    Landmark: {reviewAddress.landmark}
                  </>
                ) : null}
              </p>
            </div>

            <div className="chat-co-block">
              <div className="chat-co-block-title">
                Payment method
                <button
                  type="button"
                  onClick={handleCancelReview}
                  disabled={placing}
                >
                  Change
                </button>
              </div>
              <p>
                {paymentMethod === "card"
                  ? "Pay by Card (Stripe)"
                  : "Cash on Delivery"}
              </p>
            </div>

            {placeError && (
              <div className={`chat-co-error${ambiguousFailure ? " warn" : ""}`}>
                {placeError}
                {ambiguousFailure && (
                  <>
                    {" "}
                    <Link to="/orders" onClick={onBack}>
                      View my orders
                    </Link>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              className="chat-co-btn chat-co-btn-primary chat-co-btn-block"
              onClick={handleConfirmOrder}
              disabled={placing || redirecting || ambiguousFailure}
            >
              {placing || redirecting
                ? paymentMethod === "card"
                  ? "Redirecting to Payment..."
                  : "Placing Order..."
                : "Confirm Order"}
            </button>

            <button
              type="button"
              className="chat-co-btn chat-co-btn-ghost chat-co-btn-block"
              onClick={handleCancelReview}
              disabled={placing}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ShoppingChatWidget() {
  const { itemCount, fetchCart } = useCart()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState("chat")
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [conversationId, setConversationId] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const nextLocalIdRef = useRef(0)

  function nextLocalId(prefix) {
    nextLocalIdRef.current += 1
    return `${prefix}-${nextLocalIdRef.current}`
  }

  useEffect(() => {
    try {
      sessionStorage.removeItem("ecom_shopping_chat_conversation_id")
      sessionStorage.removeItem("ecom_shopping_chat_messages")
    } catch {
      /* ignore storage errors */
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [open, messages, sending, itemCount])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  function resetConversation() {
    setMessages([GREETING])
    setConversationId(null)
    setError(null)
    setInput("")
    setView("chat")
    inputRef.current?.focus()
  }

  function openCheckout() {
    fetchCart().catch(() => {})
    setView("checkout")
  }

  async function handleSend(rawMessage) {
    const content = rawMessage.trim()
    if (!content || sending) return

    setError(null)
    setSending(true)
    setInput("")

    const userMessage = {
      id: nextLocalId("local-user"),
      role: "user",
      content,
      products: [],
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const data = await sendShoppingChatMessage(content, conversationId)

      const replyMessage = {
        id: nextLocalId("local-assistant"),
        role: "assistant",
        content: data.reply,
        products: data.products || [],
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, replyMessage])

      if (data.conversation_id != null) {
        setConversationId(data.conversation_id)
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setConversationId(null)
        setError("This conversation expired. Send your message again to start fresh.")
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    handleSend(input)
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Shopping assistant chat">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </span>
              <div className="chat-header-text">
                <strong>Shopping Assistant</strong>
                <span>Ask about products, sizes &amp; prices</span>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-header-btn"
                onClick={resetConversation}
                aria-label="Start new chat"
                title="New chat"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                className="chat-header-btn"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                title="Close"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {itemCount > 0 && (
            <div className="chat-cart-strip">
              <span className="chat-cart-strip-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {itemCount} item{itemCount === 1 ? "" : "s"} in your cart
              </span>
              <div className="chat-cart-strip-links">
                <Link to="/cart" onClick={() => setOpen(false)}>
                  View cart
                </Link>
                {view !== "checkout" && (
                  <button type="button" onClick={openCheckout}>
                    Checkout
                  </button>
                )}
              </div>
            </div>
          )}

          {view === "checkout" ? (
            <ChatCheckout
              onBack={() => setView("chat")}
              onOrderPlaced={() => fetchCart().catch(() => {})}
            />
          ) : (
            <>
              <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble-row ${message.role}`}>
                <div className="chat-bubble">
                  <div className="chat-bubble-content">{message.content}</div>
                  {message.products?.length > 0 && (
                    <div className="chat-products">
                      {message.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onCheckout={openCheckout}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="chat-bubble-row assistant">
                <div className="chat-bubble">
                  <div className="chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            {error && <div className="chat-error">{error}</div>}

            {messages.length === 1 && !sending && (
              <div className="chat-quick">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="chat-quick-chip"
                    onClick={() => handleSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder={sending ? "Assistant is replying..." : "Ask about products..."}
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          </>
        )}
      </div>
    )}

      <button
        type="button"
        className={`chat-fab${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close shopping chat" : "Open shopping chat"}
        aria-expanded={open}
        title="Chat with shopping assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
        {!open && itemCount > 0 && (
          <span className="chat-fab-badge">{itemCount > 9 ? "9+" : itemCount}</span>
        )}
      </button>
    </div>
  )
}
