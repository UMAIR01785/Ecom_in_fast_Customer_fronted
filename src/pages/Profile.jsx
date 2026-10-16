import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api, { getErrorMessage } from "../api/client"
import { useAuth } from "../context/AuthContext"
import { convertToWebp } from "../utils/image"

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editForm, setEditForm] = useState({})
  const fileInputRef = useRef(null)
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function fetchProfile() {
      try {
        const res = await api.get("/profile")
        if (!cancelled) {
          setProfile(res.data)
          setEditForm({
            first_name: res.data.first_name || "",
            last_name: res.data.last_name || "",
            email: res.data.email || "",
            username: res.data.username || "",
            phone_number: res.data.phone_number || "",
            bio: res.data.bio || "",
            address: res.data.address || "",
            city: res.data.city || "",
          })
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.response?.status === 401) {
            logout()
            navigate("/login")
            return
          }
          setError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchProfile()
    return () => {
      cancelled = true
    }
  }, [token, logout, navigate])

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  async function handleSave(e) {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const res = await api.patch("/profile/update", editForm)
      setProfile(res.data)
      setEditing(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEditing(false)
    setError("")
    setEditForm({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      username: profile.username || "",
      phone_number: profile.phone_number || "",
      bio: profile.bio || "",
      address: profile.address || "",
      city: profile.city || "",
    })
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setUploading(true)

    try {
      const webpFile = await convertToWebp(file, { maxSize: 512 })

      const formData = new FormData()
      formData.append("file", webpFile)

      const res = await api.post("/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setProfile((prev) => ({
        ...prev,
        profile_picture: res.data.profile_picture,
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleImageDelete() {
    setError("")
    setUploading(true)

    try {
      await api.delete("/profile/image")
      setProfile((prev) => ({
        ...prev,
        profile_picture: null,
      }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">Loading your profile...</div>
      </main>
    )
  }

  if (error && !profile) {
    return (
      <main className="page">
        <div className="auth-card">
          <div className="alert alert-error">{error}</div>
        </div>
      </main>
    )
  }

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.username ||
    "My Profile"

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="page">
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          {profile?.profile_picture ? (
            <img
              src={profile.profile_picture}
              alt="Profile"
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder">
              {initials}
            </div>
          )}
          <label className="profile-image-btn" title="Change photo">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              hidden
              disabled={uploading}
            />
            {uploading ? "..." : "\u{1F4F7}"}
          </label>
          {profile?.profile_picture && (
            <button
              className="profile-image-delete-btn"
              title="Remove photo"
              onClick={handleImageDelete}
              disabled={uploading}
            >
              &times;
            </button>
          )}
        </div>
        <h1>{displayName}</h1>
        {profile?.bio && !editing && (
          <p className="profile-bio">{profile.bio}</p>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="profile-card">
        <div className="profile-card-header">
          <h2>Account Details</h2>
          {!editing && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={editForm.first_name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={editForm.last_name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={editForm.username}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={editForm.phone_number}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="bio">Bio</label>
                <input
                  id="bio"
                  name="bio"
                  type="text"
                  placeholder="Tell us about yourself"
                  value={editForm.bio}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={editForm.address}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={editForm.city}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div className="profile-form-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-fields">
            <ProfileField label="Username" value={profile?.username} />
            <ProfileField label="Email" value={profile?.email} />
            <ProfileField label="Phone Number" value={profile?.phone_number} />
            <ProfileField label="Address" value={profile?.address} />
            <ProfileField label="City" value={profile?.city} />
            <ProfileField label="Bio" value={profile?.bio} />
          </div>
        )}
      </div>
    </main>
  )
}

function ProfileField({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || "Not set"}</span>
    </div>
  )
}
