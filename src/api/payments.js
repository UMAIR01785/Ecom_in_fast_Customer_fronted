import api from "./client"

export async function getReceipt(paymentId) {
  const res = await api.get(`/payments/${paymentId}/receipt`)
  return res.data
}
