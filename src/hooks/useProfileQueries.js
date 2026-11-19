import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "../api/client"
import { queryKeys } from "../api/queryKeys"
import { useAuth } from "../context/AuthContext"

async function fetchProfile() {
  const res = await api.get("/profile")
  return res.data
}

export function useProfile() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: fetchProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function useProfileErrorHandler(query, { logout, navigate }) {
  useEffect(() => {
    if (query.error?.response?.status === 401) {
      logout()
      navigate("/login")
    }
  }, [query.error, logout, navigate])
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.patch("/profile/update", payload)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.all, data)
    },
  })
}

export function useUploadProfileImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData) => {
      const res = await api.post("/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.all, (prev) =>
        prev ? { ...prev, profile_picture: data.profile_picture } : prev
      )
    },
  })
}

export function useDeleteProfileImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete("/profile/image")
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.profile.all, (prev) =>
        prev ? { ...prev, profile_picture: null } : prev
      )
    },
  })
}
