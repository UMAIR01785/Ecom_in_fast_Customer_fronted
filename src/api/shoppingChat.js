import api from "./client"

export async function sendShoppingChatMessage(message, conversationId = null) {
  const payload = { message }
  if (conversationId != null) payload.conversation_id = conversationId
  const res = await api.post("/shopping-chat/messages", payload)
  return res.data
}

export async function checkoutShoppingChat(orderAddress, paymentMethod, confirmed = true) {
  const res = await api.post("/shopping-chat/checkout", {
    confirmed,
    checkout: {
      order_address: orderAddress,
      payment_method: paymentMethod,
    },
  })
  return res.data
}
