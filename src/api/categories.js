import api from "./client"

export async function getCategories() {
  const res = await api.get("/categories/")
  return res.data
}

export async function getCategory(slug) {
  const res = await api.get(`/categories/${slug}`)
  return res.data
}
