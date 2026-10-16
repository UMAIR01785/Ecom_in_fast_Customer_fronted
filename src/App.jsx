import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import { OrderSocketProvider } from "./context/OrderSocketContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Register from "./pages/Register"
import Login from "./pages/Login"
import Profile from "./pages/Profile"
import Categories from "./pages/Categories"
import CategoryDetail from "./pages/CategoryDetail"
import ProductDetail from "./pages/ProductDetail"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import PaymentSuccess from "./pages/PaymentSuccess"
import PaymentCancel from "./pages/PaymentCancel"
import Orders from "./pages/Orders"
import OrderDetail from "./pages/OrderDetail"

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "http://localhost:5174"

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return children
  const path = window.location.pathname
  return <Navigate to={`/login?returnTo=${encodeURIComponent(path)}`} replace />
}

function AdminRedirect() {
  useEffect(() => {
    window.location.replace(ADMIN_URL)
  }, [])
  return null
}

function WebLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/shop" element={<Categories />} />
        <Route path="/:slug" element={<CategoryDetail />} />
        <Route path="/:categorySlug/:productSlug" element={<ProductDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <OrderSocketProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Old admin URLs jump to the standalone admin app */}
              <Route path="/admin/*" element={<AdminRedirect />} />

              {/* Storefront */}
              <Route path="*" element={<WebLayout />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </OrderSocketProvider>
    </AuthProvider>
  )
}

export default App
