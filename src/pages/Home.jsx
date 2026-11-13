import shoesImage from "../images/shoes.png";
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { getCategories } from "../api/categories"
import { getProducts } from "../api/products"

const PRODUCTS_PAGE_LIMIT = 12

export default function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const productsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getProducts({ page, limit: PRODUCTS_PAGE_LIMIT })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.items || [])
          setTotalPages(data.total_pages || 0)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([])
          setTotalPages(0)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [page])

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages || newPage === page) return
    setPage(newPage)
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function getCategoryName(categorySlugs) {
    const categorySlug = categorySlugs?.[0]
    return categories.find((c) => c.slug === categorySlug)?.name || ""
  }

  function getPageNumbers() {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1>
              Discover Your<br />
              <span>Perfect Style</span>
            </h1>
            <p>
              Explore our curated collection of premium products designed to elevate your everyday.
              Quality meets style in every piece.
            </p>
            <Link to="/shop" className="hero-cta">
              <span className="hero-cta-icon">+</span>
              <span>SHOP NOW</span>
            </Link>
          </div>
          <div className="hero-image-area">
            <div className="hero-shape hero-shape-1"></div>
            <div className="hero-shape hero-shape-2"></div>
            <div className="hero-shape hero-shape-3"></div>
            <div className="hero-product-img">
              <img
                src={shoesImage}
                alt="Featured Product"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="home-content">
        {categories.length > 0 && (
          <div className="featured-categories">
            <div className="featured-categories-header">
              <h2>Featured Categories</h2>
            </div>
            <div className="featured-categories-scroll">
              {categories.map((cat) => (
                <Link
                  to={`/${cat.slug}`}
                  key={cat.id}
                  className="featured-category-card"
                >
                  <div className="featured-category-img-wrap">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="featured-category-img" />
                    ) : (
                      <div className="featured-category-placeholder">
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="featured-category-name">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="featured-products" ref={productsRef}>
          <div className="featured-products-header">
            <h2>All Products</h2>
          </div>

          {loading ? (
            <div className="featured-products-grid">
              {Array.from({ length: PRODUCTS_PAGE_LIMIT }).map((_, i) => (
                <div key={i} className="shop-product-card" style={{ pointerEvents: "none" }}>
                  <div className="shop-product-img-wrap" style={{ background: "var(--bg)", opacity: 0.6 }}></div>
                  <div className="shop-product-info">
                    <div style={{ height: 12, width: "40%", background: "var(--bg)", borderRadius: 6, marginBottom: 10 }}></div>
                    <div style={{ height: 16, width: "80%", background: "var(--bg)", borderRadius: 6, marginBottom: 12 }}></div>
                    <div style={{ height: 14, width: "50%", background: "var(--bg)", borderRadius: 6 }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="featured-products-grid">
                {products.map((product) => (
                  <div key={product.id} className="shop-product-card">
                    <Link to={`/${product.category_slugs?.[0] || ""}/${product.slug}`} className="shop-product-img-wrap">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="shop-product-img" />
                      ) : (
                        <div className="shop-product-placeholder">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {product.stock === 0 && (
                        <span className="shop-product-badge badge-out">Out</span>
                      )}
                    </Link>
                    <div className="shop-product-info">
                      <span className="shop-product-category">{getCategoryName(product.category_slugs)}</span>
                      <Link to={`/${product.category_slugs?.[0] || ""}/${product.slug}`} className="shop-product-name">
                        {product.name}
                      </Link>
                      <div className="shop-product-bottom">
                        <span className="shop-product-price">Rs {Number(product.price).toFixed(2)}</span>
                        <Link
                          to={`/${product.category_slugs?.[0] || ""}/${product.slug}`}
                          className="shop-product-add"
                        >
                          + Add
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    &laquo; Prev
                  </button>

                  {getPageNumbers().map((p) => (
                    <button
                      key={p}
                      className={`pagination-btn ${p === page ? "pagination-btn-active" : ""}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next &raquo;
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="home-empty">
              <p>No products available yet. Check back soon!</p>
            </div>
          )}
        </div>

        {categories.length === 0 && !loading && products.length === 0 && (
          <div className="home-empty">
            <p>No categories or products available yet. Check back soon!</p>
          </div>
        )}
      </section>
    </main>
  )
}
