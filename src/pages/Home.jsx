import { useRef, useState, Suspense, lazy } from "react"
import { Link } from "react-router-dom"
import { useCategories, useProducts } from "../hooks/useCatalogQueries"
import Reveal from "../components/Reveal"

const HeroScene = lazy(() => import("../components/three/HeroScene"))

const PRODUCTS_PAGE_LIMIT = 12

const BENEFITS = [
  "Free shipping over Rs 2000",
  "7-day easy returns",
  "Secure checkout",
  "Premium quality guaranteed",
  "New drops every week",
  "24/7 customer support",
]

function SectionHeader({ eyebrow, title, delay = 0 }) {
  return (
    <Reveal className="section-header" delay={delay}>
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
      <span className="section-line" aria-hidden="true" />
    </Reveal>
  )
}

export default function Home() {
  const [page, setPage] = useState(1)
  const productsRef = useRef(null)

  const categoriesQuery = useCategories()
  const productsQuery = useProducts({ page, limit: PRODUCTS_PAGE_LIMIT })

  const categories = categoriesQuery.data ?? []
  const products = productsQuery.data?.items ?? []
  const totalPages = productsQuery.data?.total_pages ?? 0
  const loading = productsQuery.isPending

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
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="hero-orb hero-orb-3" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-badge">
              <span className="hero-badge-dot" />
              NEW SEASON — FREE SHIPPING OVER RS 2000
            </span>

            <h1 className="hero-title">
              <span className="hero-title-line">Discover Your</span>
              <span className="hero-title-line hero-title-grad">
                <span>Perfect Style</span>
              </span>
            </h1>

            <p className="hero-sub">
              Explore our curated collection of premium products designed to elevate your everyday.
              Quality meets style in every piece.
            </p>

            <div className="hero-actions">
              <Link to="/shop" className="hero-cta">
                <span className="hero-cta-icon">+</span>
                <span>SHOP NOW</span>
              </Link>
              <Link to="/shop" className="hero-secondary-link">
                Browse categories →
              </Link>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>500+</strong>
                <span>Products</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>50+</strong>
                <span>Brands</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>4.9★</strong>
                <span>Rating</span>
              </div>
            </div>
          </div>

          <div className="hero-image-area">
            <div className="hero-shape hero-shape-1"></div>
            <div className="hero-shape hero-shape-2"></div>
            <div className="hero-shape hero-shape-3"></div>
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
          </div>
        </div>

        <div className="hero-scroll-cue" aria-hidden="true">
          <span className="hero-scroll-mouse">
            <span className="hero-scroll-wheel" />
          </span>
          <span className="hero-scroll-label">Scroll</span>
        </div>
      </section>

      <div className="benefits-ticker" aria-hidden="true">
        <div className="benefits-track">
          {[...BENEFITS, ...BENEFITS, ...BENEFITS].map((b, i) => (
            <span key={i} className="benefit-chip">
              <span className="benefit-star">✦</span>
              {b}
            </span>
          ))}
        </div>
      </div>

      <section className="home-content">
        {categories.length > 0 && (
          <div className="featured-categories">
            <SectionHeader eyebrow="Browse" title="Featured Categories" />
            <div className="featured-categories-scroll">
              {categories.map((cat, i) => (
                <Reveal key={cat.id} delay={i * 70}>
                  <Link to={`/${cat.slug}`} className="featured-category-card">
                    <div className="featured-category-img-wrap">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="featured-category-img" />
                      ) : (
                        <div className="featured-category-placeholder">
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="featured-category-glow" aria-hidden="true" />
                    </div>
                    <span className="featured-category-name">{cat.name}</span>
                    <span className="featured-category-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        <div className="featured-products" ref={productsRef}>
          <SectionHeader eyebrow="Shop" title="All Products" />

          {loading ? (
            <div className="featured-products-grid">
              {Array.from({ length: PRODUCTS_PAGE_LIMIT }).map((_, i) => (
                <div key={i} className="shop-product-card skeleton-card" style={{ pointerEvents: "none" }}>
                  <div className="shop-product-img-wrap skeleton-img"></div>
                  <div className="shop-product-info">
                    <div className="skeleton-line w40"></div>
                    <div className="skeleton-line w80"></div>
                    <div className="skeleton-line w50"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="featured-products-grid">
                {products.map((product, i) => (
                  <Reveal key={product.id} delay={(i % 4) * 80}>
                    <div className="shop-product-card">
                      <Link
                        to={`/${product.category_slugs?.[0] || ""}/${product.slug}`}
                        className="shop-product-img-wrap"
                      >
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="shop-product-img" />
                        ) : (
                          <div className="shop-product-placeholder">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="shop-product-shine" aria-hidden="true" />
                        {product.stock === 0 && (
                          <span className="shop-product-badge badge-out">Out</span>
                        )}
                        <span className="shop-product-view">Quick view</span>
                      </Link>
                      <div className="shop-product-info">
                        <span className="shop-product-category">
                          {getCategoryName(product.category_slugs) || "Product"}
                        </span>
                        <Link
                          to={`/${product.category_slugs?.[0] || ""}/${product.slug}`}
                          className="shop-product-name"
                        >
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
                  </Reveal>
                ))}
              </div>

              {totalPages > 1 && (
                <Reveal className="pagination">
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
                </Reveal>
              )}
            </>
          ) : (
            <div className="home-empty">
              <p>No products available yet. Check back soon!</p>
            </div>
          )}
        </div>

        <Reveal className="cta-banner">
          <div className="cta-banner-glow" aria-hidden="true" />
          <div className="cta-banner-content">
            <span className="cta-banner-eyebrow">READY TO UPGRADE?</span>
            <h2 className="cta-banner-title">Style that speaks for you</h2>
            <p className="cta-banner-text">
              Hand-picked drops, fresh every week. Find your next favorite piece today.
            </p>
            <Link to="/shop" className="btn btn-primary btn-lg cta-banner-btn">
              Explore the Shop →
            </Link>
          </div>
          <div className="cta-banner-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </Reveal>

        {categories.length === 0 && !loading && products.length === 0 && (
          <div className="home-empty">
            <p>No categories or products available yet. Check back soon!</p>
          </div>
        )}
      </section>
    </main>
  )
}
