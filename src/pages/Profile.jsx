import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getErrorMessage } from "../api/client"
import { useAuth } from "../context/AuthContext"
import {
  useProfile,
  useProfileErrorHandler,
  useUpdateProfile,
  useUploadProfileImage,
  useDeleteProfileImage,
} from "../hooks/useProfileQueries"
import { convertToWebp } from "../utils/image"

export default function Profile() {
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const profileQuery = useProfile()
  useProfileErrorHandler(profileQuery, { logout, navigate })

  const updateMutation = useUpdateProfile()
  const uploadMutation = useUploadProfileImage()
  const deleteImageMutation = useDeleteProfileImage()

  const profile = profileQuery.data ?? null
  const loading = profileQuery.isPending
  const fetchError = profileQuery.isError
    ? getErrorMessage(profileQuery.error)
    : ""

  // Seed the edit form whenever a fresh profile arrives while not editing
  useEffect(() => {
    if (!profile || editing) return
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
  }, [profile, editing])

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  async function handleSave(e) {
    e.preventDefault()
    setError("")

    try {
      await updateMutation.mutateAsync(editForm)
      setEditing(false)
    } catch (err) {
      setError(getErrorMessage(err))
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

      await uploadMutation.mutateAsync(formData)
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
      await deleteImageMutation.mutateAsync()
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

  if ((fetchError || error) && !profile) {
    return (
      <main className="page">
        <div className="auth-card">
          <div className="alert alert-error">{fetchError || error}</div>
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
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
