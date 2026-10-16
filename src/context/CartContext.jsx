import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
  mergeCart as apiMergeCart,
} from "../api/cart"
import { useAuth } from "./AuthContext"

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { isAuthenticated, token } = useAuth()
  const prevAuthRef = useRef(isAuthenticated)
  const initializedRef = useRef(false)

  // Fetch cart from backend — only clear state on real errors, not 404
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const data = await getCart()
      setCart(data)
    } catch (err) {
      // 404 means no cart exists yet (guest with no cookie, or empty cart)
      // Do NOT clear cart state — it may have been set locally by addToCart
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.detail || "Failed to load cart")
      }
      // Only set cart to null if it was never set (first load)
      // Otherwise keep the local state intact
      setCart((prev) => {
        if (prev === null && !initializedRef.current) {
          return null
        }
        return prev
      })
    } finally {
      setLoading(false)
      initializedRef.current = true
    }
  }, [])

  // Fetch cart on mount only
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Clear cart when user logs out
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      apiClearCart()
        .then(() => setCart(null))
        .catch(() => setCart(null))
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated])

  // Merge guest cart when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      apiMergeCart()
        .then((data) => setCart(data))
        .catch(() => {})
    }
  }, [isAuthenticated, token])

  const addToCart = useCallback(async (product_id, quantity = 1) => {
    try {
      setError("")
      const data = await apiAddToCart(product_id, quantity)
      setCart(data)
      return data
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to add to cart"
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const updateCartItem = useCallback(async (product_id, quantity) => {
    try {
      setError("")
      const data = await apiUpdateCartItem(product_id, quantity)
      setCart(data)
      return data
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update cart"
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const removeFromCart = useCallback(async (product_id) => {
    try {
      setError("")
      const data = await apiRemoveFromCart(product_id)
      setCart(data)
      return data
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to remove from cart"
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const clearCart = useCallback(async () => {
    try {
      setError("")
      await apiClearCart()
      setCart(null)
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to clear cart"
      setError(msg)
      throw new Error(msg)
    }
  }, [])

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const value = {
    cart,
    loading,
    error,
    itemCount,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
