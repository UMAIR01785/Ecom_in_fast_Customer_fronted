export const queryKeys = {
  products: {
    all: ["products"],
    lists: () => ["products", "list"],
    list: (params) => ["products", "list", params],
    byCategory: (slug) => ["products", "byCategory", slug],
    detail: (categorySlug, productSlug) => [
      "products",
      "detail",
      categorySlug,
      productSlug,
    ],
  },
  categories: {
    all: ["categories"],
    lists: () => ["categories", "list"],
    detail: (slug) => ["categories", "detail", slug],
  },
  variants: {
    all: ["variants"],
    byProduct: (productId) => ["variants", "product", productId],
  },
  cart: {
    all: ["cart"],
  },
  profile: {
    all: ["profile"],
  },
  orders: {
    all: ["orders"],
    lists: () => ["orders", "list"],
    // Normalized: route params are strings, API ids are numbers —
    // both must resolve to the same cache entry.
    detail: (id) => ["orders", "detail", String(id)],
  },
  refunds: {
    all: ["refunds"],
    mine: () => ["refunds", "mine"],
  },
  payments: {
    all: ["payments"],
    receipt: (paymentId) => ["payments", "receipt", paymentId],
  },
}
