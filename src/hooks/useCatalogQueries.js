import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getProducts, getProductsByCategory, getProduct } from "../api/products"
import { getCategories, getCategory } from "../api/categories"
import { getProductVariants } from "../api/productVariants"
import { queryKeys } from "../api/queryKeys"

// Cache policies (staleTime / gcTime):
// products, product details, variants -> 5 min / 30 min
// categories                          -> 10 min / 30 min

export function useProducts({ page = 1, limit = 12 } = {}) {
  return useQuery({
    queryKey: queryKeys.products.list({ page, limit }),
    queryFn: () => getProducts({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useProductsByCategory(categorySlug, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.products.byCategory(categorySlug),
    queryFn: () => getProductsByCategory(categorySlug),
    enabled: enabled && Boolean(categorySlug),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useProduct(categorySlug, productSlug) {
  return useQuery({
    queryKey: queryKeys.products.detail(categorySlug, productSlug),
    queryFn: () => getProduct(categorySlug, productSlug),
    enabled: Boolean(categorySlug && productSlug),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: getCategories,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useCategory(slug) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => getCategory(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useProductVariants(productId) {
  return useQuery({
    queryKey: queryKeys.variants.byProduct(productId),
    queryFn: () => getProductVariants(productId),
    enabled: Boolean(productId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}
