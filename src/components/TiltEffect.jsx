import { useEffect } from "react"

const SELECTOR =
  ".tilt, .shop-product-card, .product-card, .category-card, .featured-category-card, .sc-item, .auth-card, .profile-card, .pd-image-wrap, .detail-image-wrap"

export default function TiltEffect() {
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return

    function onMove(e) {
      const el = e.target.closest?.(SELECTOR)
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      el.style.setProperty("--rx", `${(0.5 - py) * 14}deg`)
      el.style.setProperty("--ry", `${(px - 0.5) * 16}deg`)
      el.classList.add("tilt-active")
    }

    function onLeave(e) {
      const el = e.target.closest?.(SELECTOR)
      if (!el) return
      el.style.setProperty("--rx", "0deg")
      el.style.setProperty("--ry", "0deg")
      el.classList.remove("tilt-active")
    }

    document.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("pointerleave", onLeave, { passive: true, capture: true })
    document.addEventListener("pointerout", onLeave, { passive: true })

    return () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave, { capture: true })
      document.removeEventListener("pointerout", onLeave)
    }
  }, [])

  return null
}
