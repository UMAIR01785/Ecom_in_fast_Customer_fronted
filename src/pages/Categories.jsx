import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getCategories } from "../api/categories"
import { getErrorMessage } from "../api/client"

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchCategories() {
      try {
        const data = await getCategories()
        if (!cancelled) setCategories(data)
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCategories()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <main className="page">
        <div className="categories-hero">
          <span className="categories-badge">Browse Collections</span>
          <h1>Our Categories</h1>
          <p>Discover a wide range of products organized just for you</p>
        </div>
        <div className="categories-loading">
          <div className="categories-loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="category-skeleton">
                <div className="category-skeleton-img" />
                <div className="category-skeleton-body">
                  <div className="category-skeleton-title" />
                  <div className="category-skeleton-text" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page">
        <div className="categories-hero">
          <span className="categories-badge">Browse Collections</span>
          <h1>Our Categories</h1>
          <p>Discover a wide range of products organized just for you</p>
        </div>
        <div className="categories-error">
          <div className="categories-error-icon">&#9888;</div>
          <p>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page categories-page">
      <div className="categories-hero">
        <span className="categories-badge">Browse Collections</span>
        <h1>Our Categories</h1>
        <p>Discover a wide range of products organized just for you</p>
      </div>

      {categories.length === 0 ? (
        <div className="categories-empty">
          <div className="categories-empty-icon">&#128193;</div>
          <h3>No categories available</h3>
          <p>We&apos;re curating our collections. Check back soon!</p>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((cat, index) => (
            <Link
              to={`/${cat.slug}`}
              key={cat.id}
              className="category-card"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {cat.image ? (
                <div className="category-card-image-wrap">
                  <img src={cat.image} alt={cat.name} className="category-card-image" />
                  <div className="category-card-overlay" />
                </div>
              ) : (
                <div className="category-card-placeholder">
                  <span>{cat.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="category-card-body">
                <h3>{cat.name}</h3>
                {cat.description && (
                  <p>{cat.description}</p>
                )}
                <span className="category-card-link">
                  Explore
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
