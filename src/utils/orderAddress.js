export function addressLine(address) {
  if (!address) return ""
  if (typeof address === "string") return address
  return [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ")
}
