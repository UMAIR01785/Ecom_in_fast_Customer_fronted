import api from "./client"

export async function getCart() {
  const res = await api.get("/cart")
  return res.data
}

export async function addToCart(product_id, quantity = 1) {
  const res = await api.post("/cart/items", { product_id, quantity })
  return res.data
}

export async function updateCartItem(product_id, quantity) {
  const res = await api.patch(`/cart/items/${product_id}`, { quantity })
  return res.data
}

export async function removeFromCart(product_id) {
  const res = await api.delete(`/cart/items/${product_id}`)
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
