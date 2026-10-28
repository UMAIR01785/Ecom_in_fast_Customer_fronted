import api from "./client"

export async function sendShoppingChatMessage(message, conversationId = null) {
  const payload = { message }
  if (conversationId != null) payload.conversation_id = conversationId
  const res = await api.post("/shopping-chat/messages", payload)
  return res.data
}
