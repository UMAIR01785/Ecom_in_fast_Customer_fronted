import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getProduct } from "../api/products"
import { getCategory } from "../api/categories"
import { getProductVariants } from "../api/productVariants"
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
  const [variantsData, setVariantsData] = useState(null)
  const [pickedColor, setPickedColor] = useState("")
  const [pickedSize, setPickedSize] = useState("")
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

  useEffect(() => {
    if (!product?.id) return
    let cancelled = false

    getProductVariants(product.id)
      .then((data) => {
        if (!cancelled) {
          setVariantsData({
            productId: product.id,
            list: (data || []).filter((v) => v.is_active),
          })
        }
      })
      .catch(() => {
        if (!cancelled) setVariantsData({ productId: product.id, list: [] })
      })

    return () => { cancelled = true }
  }, [product?.id])

  const variantsLoading = Boolean(product) && variantsData?.productId !== product.id
  const variants =
    product && variantsData?.productId === product.id ? variantsData.list : []

  const colors = [...new Set(variants.map((v) => v.color))]
  const selectedColor = colors.includes(pickedColor)
    ? pickedColor
    : colors[0] || ""
  const colorVariants = variants.filter((v) => v.color === selectedColor)
  const sizes = [...new Set(colorVariants.map((v) => v.size))]
  const selectedSize = sizes.includes(pickedSize)
    ? pickedSize
    : (colorVariants.find((v) => v.stock > 0) || colorVariants[0])?.size || ""

  const hasVariants = variants.length > 0
  const selectedVariant =
    colorVariants.find((v) => v.size === selectedSize) || null

  const displayPrice =
    selectedVariant?.price != null
      ? Number(selectedVariant.price)
      : Number(product?.price ?? 0)

  const displayStock = hasVariants
    ? selectedVariant
      ? selectedVariant.stock
      : null
    : product?.stock

  async function handleAddToCart() {
    if (!product || adding) return
    if (hasVariants && !selectedVariant) {
      setError("Please select a size and color")
      return
    }
    setAdding(true)
    try {
      await addToCart(product.id, 1, selectedVariant ? selectedVariant.id : null)
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
            <span className="pd-price">Rs {displayPrice.toFixed(2)}</span>
            <span
              className={
                displayStock == null
                  ? "pd-stock"
                  : `pd-stock ${displayStock > 0 ? "in-stock" : "out-of-stock"}`
              }
            >
              {displayStock == null
                ? "Select size & color"
                : displayStock > 0
                  ? `${displayStock} in stock`
                  : "Out of stock"}
            </span>
          </div>

          {product.description && (
            <p className="pd-description">{product.description}</p>
          )}

          {variantsLoading && (
            <p className="pd-variant-loading">Loading sizes &amp; colors...</p>
          )}

          {!variantsLoading && hasVariants && (
            <div className="pd-variants">
              <div className="pd-variant-group">
                <div className="pd-variant-head">
                  <span className="pd-variant-label">Color</span>
                  <span className="pd-variant-value">{selectedColor}</span>
                </div>
                <div className="pd-variant-options">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`pd-variant-chip ${
                        selectedColor === color ? "active" : ""
                      }`}
                      onClick={() => setPickedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pd-variant-group">
                <div className="pd-variant-head">
                  <span className="pd-variant-label">Size</span>
                  <span className="pd-variant-value">{selectedSize}</span>
                </div>
                <div className="pd-variant-options">
                  {sizes.map((size) => {
                    const sizeVariant = colorVariants.find(
                      (v) => v.size === size
                    )
                    const out = !sizeVariant || sizeVariant.stock <= 0
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`pd-variant-chip ${
                          selectedSize === size ? "active" : ""
                        } ${out ? "disabled" : ""}`}
                        disabled={out}
                        onClick={() => setPickedSize(size)}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedVariant && (
                <div className="pd-variant-sku">
                  SKU: <strong>{selectedVariant.sku}</strong>
                </div>
              )}
            </div>
          )}

          <div className="pd-actions">
            <button
              className="btn btn-primary btn-lg pd-btn-cart"
              disabled={
                adding ||
                (hasVariants && (!selectedVariant || selectedVariant.stock <= 0)) ||
                (!hasVariants && product.stock === 0)
              }
              onClick={handleAddToCart}
            >
              {adding
                ? "ADDING..."
                : hasVariants
                  ? !selectedVariant
                    ? "SELECT SIZE & COLOR"
                    : selectedVariant.stock <= 0
                      ? "OUT OF STOCK"
                      : "ADD TO BAG"
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
              <span className="pd-meta-value">
                {(selectedVariant?.sku || product.slug).toUpperCase()}
              </span>
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
                  <td className="pd-info-value">
                    {(selectedVariant?.sku || product.slug).toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td className="pd-info-label">Category</td>
                  <td className="pd-info-value">{category?.name || "N/A"}</td>
                </tr>
                <tr>
                  <td className="pd-info-label">Stock</td>
                  <td className="pd-info-value">
                    {hasVariants
                      ? selectedVariant
                        ? `${selectedVariant.stock} units (${selectedVariant.size} / ${selectedVariant.color})`
                        : "Select size & color"
                      : `${product.stock} units`}
                  </td>
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
