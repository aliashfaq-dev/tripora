import api from "./client";

export const getChats = () => api.get("/chats");

export const createChat = async (data = {}) => {
  try {
    return await api.post("/chats", data);
  } catch (error) {
    // Some backend revisions use userId/recipientId for the other participant.
    if (![400, 422].includes(error?.response?.status)) throw error;
    const peerId = data.participantId || data.recipientId || data.userId;
    if (!peerId) throw error;
    return api.post("/chats", { ...data, participantId: peerId, recipientId: peerId, userId: peerId });
  }
};

export const getChatMessages = (chatId) => api.get(`/chats/${chatId}/messages`);

// Backend contract: POST /api/v1/chats/:chatId/messages
// Body: { content: "Hello" } (the backend also accepts `text`).
export const sendChatMessage = (chatId, content) =>
  api.post(`/chats/${encodeURIComponent(chatId)}/messages`, { content });

// Backend contract: DELETE /api/v1/chats/:chatId
export const deleteChat = (chatId) => api.delete(`/chats/${chatId}`);

// Backend contract: block/unblock users under /api/v1/users/:userId/block
export const blockChatPerson = (userId) => api.post(`/users/${userId}/block`);
export const unblockChatPerson = (userId) => api.delete(`/users/${userId}/block`);
export const getBlockedUsers = () => api.get("/users/blocked");


export const markChatRead = async (chatId) => {
  const routes = [`/chats/${encodeURIComponent(chatId)}/read`, `/chats/${encodeURIComponent(chatId)}/messages/read`];
  let lastError;
  for (const route of routes) {
    try { return await api.patch(route); }
    catch (error) { lastError = error; if (error?.response?.status !== 404 && error?.response?.status !== 405) throw error; }
  }
  throw lastError;
};
