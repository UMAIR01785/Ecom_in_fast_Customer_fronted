import api from "./client"

export async function getProductVariants(productId) {
  const res = await api.get(`/products/${productId}/variants`)
  return res.data
}
