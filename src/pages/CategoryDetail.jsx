import { useParams, Link } from "react-router-dom"
import { useCategory, useProductsByCategory } from "../hooks/useCatalogQueries"
import { getErrorMessage } from "../api/client"

export default function CategoryDetail() {
  const { slug } = useParams()

  const categoryQuery = useCategory(slug)
  const productsQuery = useProductsByCategory(slug)

  const category = categoryQuery.data ?? null
  const products = productsQuery.data ?? []
  const loading = categoryQuery.isPending || productsQuery.isPending
  const error = categoryQuery.isError
    ? getErrorMessage(categoryQuery.error)
    : productsQuery.isError
      ? getErrorMessage(productsQuery.error)
      : ""

  if (loading) {
    return (
      <main className="page">
        <div className="detail-loading">
          <div className="detail-skeleton-title" />
          <div className="detail-skeleton-text" />
          <div className="detail-skeleton-text short" />
        </div>
      </main>
    )
  }

  if (error || !category) {
    return (
      <main className="page">
        <div className="detail-error">
          <div className="detail-error-icon">&#9888;</div>
          <h2>Category Not Found</h2>
          <p>{error || "The category you're looking for doesn't exist or has been removed."}</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page detail-page">
      <div className="category-hero">
        <h1>{category.name}</h1>
        <p>Discover our latest collection of premium products — comfort, design, and quality in every piece.</p>
      </div>

      <div className="products-section">
        {products.length === 0 ? (
          <div className="products-empty">
            <div className="products-empty-icon">&#128230;</div>
            <h3>No products yet</h3>
            <p>This category doesn&apos;t have any products at the moment.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product, index) => (
              <Link
                to={`/${category.slug}/${product.slug}`}
                key={product.id}
                className="product-card"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                {product.image ? (
                  <div className="product-card-image-wrap">
                    <img src={product.image} alt={product.name} className="product-card-image" />
                  </div>
                ) : (
                  <div className="product-card-placeholder">
                    <span>{product.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="product-card-body">
                  <h3>{product.name}</h3>
                  <div className="product-card-footer">
                    <span className="product-card-price">Rs {Number(product.price).toFixed(2)}</span>
                  </div>
                  <span className="product-card-btn">View Detail</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
