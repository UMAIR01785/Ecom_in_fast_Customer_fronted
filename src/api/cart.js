import api from "./client"

export async function getCart() {
  const res = await api.get("/cart")
  return res.data
}

export async function addToCart(product_id, quantity = 1, variant_id = null) {
  const payload = { product_id, quantity }
  if (variant_id != null) payload.variant_id = variant_id
  const res = await api.post("/cart/items", payload)
  return res.data
}

export async function updateCartItem(cart_item_id, quantity) {
  const res = await api.patch(`/cart/items/${cart_item_id}`, { quantity })
  return res.data
}

export async function removeFromCart(cart_item_id) {
  const res = await api.delete(`/cart/items/${cart_item_id}`)
  return res.data
}

export async function clearCart() {
  const res = await api.delete("/cart")
  return res.data
}

export async function mergeCart() {
  const res = await api.post("/cart/merge")
  return res.data
}
