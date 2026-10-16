import api from "./client"

export async function getProducts({ page = 1, limit = 12 } = {}) {
  const res = await api.get("/products/", { params: { page, limit } })
  return res.data
}

export async function getProductsByCategory(categorySlug) {
  const res = await api.get(`/products/${categorySlug}`)
  return res.data
}

export async function getProduct(categorySlug, productSlug) {
  const res = await api.get(`/products/${categorySlug}/${productSlug}`)
  return res.data
}
