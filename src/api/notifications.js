import api from "./client";

let notificationFeedUnavailable = false;

const missing = (error) => [404, 405].includes(error?.response?.status);

export const getNotifications = async (params = {}) => {
  if (notificationFeedUnavailable) return { data: { notifications: [] } };
  try {
    return await api.get("/notifications", { params });
  } catch (error) {
    if (missing(error)) {
      notificationFeedUnavailable = true;
      return { data: { notifications: [] } };
    }
    throw error;
  }
};

export const markNotificationRead = async (id) => {
  if (!id || notificationFeedUnavailable) return null;
  try { return await api.patch(`/notifications/${encodeURIComponent(id)}/read`); }
  catch (error) { if (missing(error)) return null; throw error; }
};

export const markChatRead = async (chatId) => {
  if (!chatId) return null;
  const routes = [
    `/chats/${encodeURIComponent(chatId)}/read`,
    `/chats/${encodeURIComponent(chatId)}/messages/read`,
  ];
  let lastError;
  for (const route of routes) {
    try { return await api.patch(route); }
    catch (error) { lastError = error; if (!missing(error)) throw error; }
  }
  return null;
};

export const markMessagesRead = markChatRead;
