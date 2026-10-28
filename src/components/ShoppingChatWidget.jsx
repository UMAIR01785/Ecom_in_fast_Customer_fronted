import { useEffect, useRef, useState } from "react"
import { sendShoppingChatMessage } from "../api/shoppingChat"
import { getErrorMessage } from "../api/client"

const CONVERSATION_STORAGE_KEY = "ecom_shopping_chat_conversation_id"

const QUICK_PROMPTS = [
  "Show me running shoes",
  "Any sneakers on sale?",
  "Help me pick a gift",
]

const GREETING = {
  id: "local-greeting",
  role: "assistant",
  content:
    "Hi! I'm your shopping assistant. Ask me about products, sizes, colors, or prices and I'll help you find the right pair.",
  products: [],
  created_at: null,
}

function loadConversationId() {
  try {
    const stored = sessionStorage.getItem(CONVERSATION_STORAGE_KEY)
    return stored ? Number(stored) : null
  } catch {
    return null
  }
}

function saveConversationId(id) {
  try {
    if (id == null) sessionStorage.removeItem(CONVERSATION_STORAGE_KEY)
    else sessionStorage.setItem(CONVERSATION_STORAGE_KEY, String(id))
  } catch {
    /* ignore storage errors */
  }
}

function formatPrice(value) {
  if (value == null) return null
  return `Rs ${Number(value).toFixed(2)}`
}

function ProductCard({ product }) {
  return (
    <div className="chat-product-card">
      {product.image ? (
        <img src={product.image} alt={product.name} className="chat-product-img" />
      ) : (
        <div className="chat-product-img chat-product-img-placeholder">👟</div>
      )}
      <div className="chat-product-info">
        <p className="chat-product-name">{product.name}</p>
        <div className="chat-product-meta">
          {product.price != null && (
            <span className="chat-product-price">{formatPrice(product.price)}</span>
          )}
          <span
            className={`chat-product-stock${product.stock > 0 ? " in" : " out"}`}
          >
            {product.stock > 0 ? "In stock" : "Out of stock"}
          </span>
        </div>
        {product.variants?.length > 0 && (
          <p className="chat-product-variants">
            {product.variants.slice(0, 4).map((v) => v.size || v.color).filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ShoppingChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [conversationId, setConversationId] = useState(loadConversationId)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const nextLocalIdRef = useRef(0)

  function nextLocalId(prefix) {
    nextLocalIdRef.current += 1
    return `${prefix}-${nextLocalIdRef.current}`
  }

  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [open, messages, sending])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

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
        saveConversationId(data.conversation_id)
      }
    } catch (err) {
      setError(getErrorMessage(err))
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
            <button
              type="button"
              className="chat-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-bubble-row ${message.role}`}>
                <div className="chat-bubble">
                  <div className="chat-bubble-content">{message.content}</div>
                  {message.products?.length > 0 && (
                    <div className="chat-products">
                      {message.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
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
              placeholder={sending ? "Assistant is typing..." : "Ask about products..."}
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
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
      </button>
    </div>
  )
}
