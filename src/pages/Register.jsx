import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getErrorMessage } from "../api/client"

const initialValues = {
  first_name: "",
  last_name: "",
  email: "",
  username: "",
  phone_number: "",
  password: "",
  confirm_password: "",
}

export default function Register() {
  const [form, setForm] = useState(initialValues)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shouldNavigate, setShouldNavigate] = useState(false)
  const { register, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/"

  useEffect(() => {
    if (shouldNavigate && isAuthenticated) {
      navigate(returnTo, { replace: true })
    }
  }, [shouldNavigate, isAuthenticated, navigate, returnTo])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    if (form.first_name.trim().length < 2) return "First name must be at least 2 characters."
    if (form.last_name.trim().length < 2) return "Last name must be at least 2 characters."
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email address."
    if (form.username.trim().length < 3) return "Username must be at least 3 characters."
    if (!form.phone_number.trim()) return "Phone number is required."
    if (form.password.length <= 8) return "Password must be more than 8 characters."
    if (form.password !== form.confirm_password) return "Passwords do not match."
    return ""
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await register(form)
      await login(form.email, form.password)
      setShouldNavigate(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card auth-card-lg">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Join ShopSphere in less than a minute.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="johndoe"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Phone Number (Pakistan)</label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              placeholder="03001234567"
              value={form.phone_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="More than 8 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </main>
  )
}
