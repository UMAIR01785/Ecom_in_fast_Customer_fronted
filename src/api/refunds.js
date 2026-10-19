import api from "./client"

export async function requestRefund(orderId, reason) {
  const res = await api.post(`/orders/${orderId}/refunds`, { reason })
  return res.data
}

export async function getMyRefunds() {
  const res = await api.get("/refunds/mine")
  return res.data
}
