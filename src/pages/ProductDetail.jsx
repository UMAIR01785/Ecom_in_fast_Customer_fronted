import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getProduct } from "../api/products"
import { getCategory } from "../api/categories"
import { getErrorMessage } from "../api/client"
import { useCart } from "../context/CartContext"

export default function ProductDetail() {
  const { categorySlug, productSlug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("description")
  const [adding, setAdding] = useState(false)
  const { addToCart } = useCart()

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const [prodData, catData] = await Promise.all([
          getProduct(categorySlug, productSlug),
          getCategory(categorySlug),
        ])
        if (!cancelled) {
          setProduct(prodData)
          setCategory(catData)
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [categorySlug, productSlug])

  async function handleAddToCart() {
    if (!product || adding) return
    setAdding(true)
    try {
      await addToCart(product.id, 1)
      navigate("/cart")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="pd-loading">
          <div className="pd-skeleton-image" />
          <div className="pd-skeleton-info">
            <div className="pd-skeleton-breadcrumb" />
            <div className="pd-skeleton-title" />
            <div className="pd-skeleton-price" />
            <div className="pd-skeleton-text" />
            <div className="pd-skeleton-text short" />
            <div className="pd-skeleton-btn" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="page">
        <div className="pd-error">
          <div className="pd-error-icon">&#9888;</div>
          <h2>Product Not Found</h2>
          <p>{error || "The product you're looking for doesn't exist or has been removed."}</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page pd-page">
      <nav className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <Link to={`/${categorySlug}`}>{category?.name || "Category"}</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">{product.name}</span>
      </nav>

      <div className="pd-layout">
        <div className="pd-image-section">
          {product.image ? (
            <div className="pd-image-wrap">
              <img src={product.image} alt={product.name} className="pd-image" />
              {!product.is_active && (
                <span className="pd-badge pd-badge-inactive">Inactive</span>
              )}
            </div>
          ) : (
            <div className="pd-placeholder">
              <span>{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="pd-info-section">
          <h1 className="pd-name">{product.name}</h1>

          <div className="pd-price-row">
            <span className="pd-price">Rs {Number(product.price).toFixed(2)}</span>
            <span className={`pd-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          {product.description && (
            <p className="pd-description">{product.description}</p>
          )}

          <div className="pd-actions">
            <button
              className="btn btn-primary btn-lg pd-btn-cart"
              disabled={product.stock === 0 || adding}
              onClick={handleAddToCart}
            >
              {adding
                ? "ADDING..."
                : product.stock > 0
                  ? "ADD TO BAG"
                  : "OUT OF STOCK"}
            </button>
            <button className="btn btn-outline btn-lg pd-btn-wishlist">
              &#9825;
            </button>
          </div>

          <div className="pd-meta">
            <div className="pd-meta-item">
              <span className="pd-meta-label">Category</span>
              <span className="pd-meta-value">{category?.name || "N/A"}</span>
            </div>
            <div className="pd-meta-item">
              <span className="pd-meta-label">SKU</span>
              <span className="pd-meta-value">{product.slug.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pd-tabs">
        <button
          className={`pd-tab ${activeTab === "description" ? "active" : ""}`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </button>
        <button
          className={`pd-tab ${activeTab === "info" ? "active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Product Info
        </button>
      </div>

      <div className="pd-tab-content">
        {activeTab === "description" && (
          <div className="pd-tab-panel">
            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p className="pd-no-desc">No description available for this product.</p>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="pd-tab-panel">
            <table className="pd-info-table">
              <tbody>
                <tr>
                  <td className="pd-info-label">SKU</td>
                  <td className="pd-info-value">{product.slug.toUpperCase()}</td>
                </tr>
                <tr>
                  <td className="pd-info-label">Category</td>
                  <td className="pd-info-value">{category?.name || "N/A"}</td>
                </tr>
                <tr>
                  <td className="pd-info-label">Stock</td>
                  <td className="pd-info-value">{product.stock} units</td>
                </tr>
                <tr>
                  <td className="pd-info-label">Status</td>
                  <td className="pd-info-value">
                    <span className={`pd-status ${product.is_active ? "active" : "inactive"}`}>
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="pd-info-label">Created</td>
                  <td className="pd-info-value">
                    {new Date(product.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="pd-info-label">Last Updated</td>
                  <td className="pd-info-value">
                    {new Date(product.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
