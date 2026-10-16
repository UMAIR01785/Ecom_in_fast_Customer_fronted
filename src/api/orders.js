import api from "./client"

export async function checkout(order_address, payment_method = "cod") {
  const res = await api.post("/orders/checkout", { order_address, payment_method })
  return res.data
}

export async function getOrders() {
  const res = await api.get("/orders/")
  return res.data
}

export async function getOrder(orderId) {
  const res = await api.get(`/orders/${orderId}`)
  return res.data
}

export async function cancelOrder(orderId) {
  const res = await api.patch(`/orders/${orderId}/cancel`)
  return res.data
}
