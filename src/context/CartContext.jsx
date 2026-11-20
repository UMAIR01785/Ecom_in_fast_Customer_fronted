import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
  mergeCart as apiMergeCart,
} from "../api/cart"
import { queryKeys } from "../api/queryKeys"
import { getErrorMessage } from "../api/client"
import { useAuth } from "./AuthContext"

const CartContext = createContext(null)

async function fetchCartFromServer(queryClient) {
  try {
    return await getCart()
  } catch (err) {
    // 404 means no cart exists yet (guest with no cookie, or empty cart).
    // Keep any cart we already know about instead of clobbering it.
    if (err?.response?.status === 404) {
      const prev = queryClient.getQueryData(queryKeys.cart.all)
      return prev !== undefined ? prev : null
    }
    throw err
  }
}

function recomputeTotals(cart) {
  if (!cart?.items) return cart
  const items = cart.items.map((item) => {
    const unit = Number(item.variant?.price ?? item.product?.price ?? 0)
    return { ...item, item_total: unit * item.quantity }
  })
  const subtotal = items.reduce((sum, item) => sum + item.item_total, 0)
  return { ...cart, items, subtotal }
}

export function CartProvider({ children }) {
  const queryClient = useQueryClient()
  const { isAuthenticated, token } = useAuth()
  const [error, setError] = useState("")
  const prevAuthRef = useRef(isAuthenticated)
  const mergedTokenRef = useRef(null)

  const cartQuery = useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => fetchCartFromServer(queryClient),
    // Cart is user-specific and changes on every mutation: never serve it
    // from cache on mount/reconnect (staleTime 0) and drop it quickly when
    // inactive. Focus refetch stays off to avoid requests while typing.
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const cart = cartQuery.data ?? null
  // Skeleton only when we have nothing to show yet — not while a
  // background refetch runs over an already-populated cart.
  const loading = cartQuery.isPending && !cart
  const { refetch } = cartQuery

  const fetchCart = useCallback(async () => {
    const result = await refetch()
    return result.data
  }, [refetch])

  const addToCartMutation = useMutation({
    mutationFn: ({ product_id, quantity = 1, variant_id = null }) =>
      apiAddToCart(product_id, quantity, variant_id),
    onMutate: async () => {
      setError("")
      // Stop any in-flight GET /cart so a stale empty response
      // cannot land after we write the post-add cart below.
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all })
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(queryKeys.cart.all, data)
      }
    },
    onError: (err) => {
      setError(getErrorMessage(err))
    },
  })

  const updateCartItemMutation = useMutation({
    mutationFn: ({ cart_item_id, quantity }) =>
      apiUpdateCartItem(cart_item_id, quantity),
    onMutate: async ({ cart_item_id, quantity }) => {
      setError("")
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all })
      const prev = queryClient.getQueryData(queryKeys.cart.all)
      queryClient.setQueryData(queryKeys.cart.all, (old) => {
        if (!old?.items) return old
        const next = {
          ...old,
          items: old.items.map((item) =>
            item.id === cart_item_id ? { ...item, quantity } : item
          ),
        }
        return recomputeTotals(next)
      })
      return { prev }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(queryKeys.cart.all, data)
      }
    },
    onError: (err, _vars, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.cart.all, context.prev)
      }
      setError(getErrorMessage(err))
    },
    onSettled: () => {
      // Server response already landed in onSuccess; only refetch if the
      // cache is empty (e.g. mutation failed before any write).
      if (!queryClient.getQueryData(queryKeys.cart.all)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
      }
    },
  })

  const removeFromCartMutation = useMutation({
    mutationFn: (cart_item_id) => apiRemoveFromCart(cart_item_id),
    onMutate: async (cart_item_id) => {
      setError("")
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all })
      const prev = queryClient.getQueryData(queryKeys.cart.all)
      queryClient.setQueryData(queryKeys.cart.all, (old) => {
        if (!old?.items) return old
        const next = {
          ...old,
          items: old.items.filter((item) => item.id !== cart_item_id),
        }
        return recomputeTotals(next)
      })
      return { prev }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(queryKeys.cart.all, data)
      }
    },
    onError: (err, _vars, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.cart.all, context.prev)
      }
      setError(getErrorMessage(err))
    },
    onSettled: () => {
      if (!queryClient.getQueryData(queryKeys.cart.all)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
      }
    },
  })

  const clearCartMutation = useMutation({
    mutationFn: () => apiClearCart(),
    onMutate: () => setError(""),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.cart.all, null)
    },
    onError: (err) => {
      setError(getErrorMessage(err))
    },
  })

  // Clear cart when user logs out
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      apiClearCart()
        .catch(() => {})
        .finally(() => {
          queryClient.setQueryData(queryKeys.cart.all, null)
        })
    }
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated, queryClient])

  // Merge guest cart when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      if (mergedTokenRef.current === token) return
      mergedTokenRef.current = token

      apiMergeCart()
        .then((data) => {
          queryClient.setQueryData(queryKeys.cart.all, data)
        })
        .catch(() => {})
    } else {
      mergedTokenRef.current = null
    }
  }, [isAuthenticated, token, queryClient])

  const { mutateAsync: addToCartAsync } = addToCartMutation
  const { mutateAsync: updateCartItemAsync } = updateCartItemMutation
  const { mutateAsync: removeFromCartAsync } = removeFromCartMutation
  const { mutateAsync: clearCartAsync } = clearCartMutation

  const addToCart = useCallback(
    (product_id, quantity = 1, variant_id = null) =>
      addToCartAsync({ product_id, quantity, variant_id }),
    [addToCartAsync]
  )

  const updateCartItem = useCallback(
    (cart_item_id, quantity) =>
      updateCartItemAsync({ cart_item_id, quantity }),
    [updateCartItemAsync]
  )

  const removeFromCart = useCallback(
    (cart_item_id) => removeFromCartAsync(cart_item_id),
    [removeFromCartAsync]
  )

  const clearCart = useCallback(() => clearCartAsync(), [clearCartAsync])

  const itemCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  const queryError = cartQuery.isError ? getErrorMessage(cartQuery.error) : ""

  const value = {
    cart,
    loading,
    error: error || queryError,
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
