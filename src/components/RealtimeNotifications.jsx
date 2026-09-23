import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Heart, MessageCircle, CalendarCheck, Info } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createChatSocket } from "../api/socket";
import { getChats, getChatMessages } from "../api/chat";
import { getMyPosts } from "../api/posts";
import { getBookings, getOwnedBookings } from "../api/bookings";
import { getNotifications, markNotificationRead, markChatRead } from "../api/notifications";
import { getList, unwrap } from "../api/response";
import { fetchAllPages } from "../api/pagination";

const idOf = (value) => value?._id || value?.id || null;
const senderOf = (value) => {
  const sender = value?.sender || value?.fromUser || value?.from;
  return sender?._id || sender?.id || (typeof sender === "string" ? sender : null);
};
const textOf = (value) => {
  if (!value) return "New activity";
  if (typeof value === "string") return value;
  if (typeof value.text === "string") return value.text;
  if (typeof value.content === "string") return value.content;
  if (typeof value.message === "string") return value.message;
  if (typeof value.message?.text === "string") return value.message.text;
  if (typeof value.notification?.message === "string") return value.notification.message;
  if (typeof value.notification?.text === "string") return value.notification.text;
  if (typeof value.body === "string") return value.body;
  if (typeof value.lastMessageText === "string") return value.lastMessageText;
  if (typeof value.title === "string") return value.title;
  return "New activity";
};
const timeOf = (value) => {
  const raw = value?.createdAt || value?.updatedAt || value?.at || value?.timestamp;
  const time = raw ? new Date(raw).getTime() : Date.now();
  return Number.isFinite(time) ? time : Date.now();
};
const chatIdOf = (chat) => idOf(chat) || chat?.chatId || chat?.conversationId || null;
const bookingIdOf = (value) =>
  value?.bookingId ||
  value?.entityId ||
  value?.data?.bookingId ||
  value?.data?.entityId ||
  value?.booking?._id ||
  value?.booking?.id ||
  value?.data?.booking?._id ||
  value?.data?.booking?.id ||
  null;


const ownerIdOf = (booking) =>
  idOf(booking?.trip?.ownerId) || idOf(booking?.trip?.owner) || idOf(booking?.trip?.createdBy) ||
  idOf(booking?.trip?.userId) || idOf(booking?.trip?.user) || idOf(booking?.trip?.sellerId) ||
  idOf(booking?.trip?.seller) || idOf(booking?.tripId?.ownerId) || idOf(booking?.tripId?.owner) ||
  idOf(booking?.tripId?.createdBy) || idOf(booking?.tripId?.userId) || idOf(booking?.tripId?.user) ||
  idOf(booking?.post?.ownerId) || idOf(booking?.post?.owner) || idOf(booking?.post?.createdBy) ||
  idOf(booking?.post?.userId) || idOf(booking?.post?.user) || idOf(booking?.postId?.ownerId) ||
  idOf(booking?.postId?.owner) || idOf(booking?.postId?.createdBy) || idOf(booking?.postId?.userId) ||
  idOf(booking?.sellerId) || idOf(booking?.seller);

const requesterIdOf = (booking) =>
  idOf(booking?.userId) || idOf(booking?.user) || idOf(booking?.travelerId) ||
  idOf(booking?.traveler) || idOf(booking?.traveler?.userId) || idOf(booking?.bookedBy) ||
  idOf(booking?.booker) || idOf(booking?.buyerId) || idOf(booking?.buyer) ||
  idOf(booking?.customerId) || idOf(booking?.customer);

const bookingTripTitleOf = (value) =>
  value?.trip?.title ||
  value?.tripId?.title ||
  value?.post?.title ||
  value?.postId?.title ||
  value?.booking?.trip?.title ||
  value?.booking?.post?.title ||
  "your trip";

const bookingStatusOf = (value) => String(
  value?.status ||
  value?.bookingStatus ||
  value?.booking?.status ||
  value?.data?.status ||
  value?.data?.booking?.status ||
  ""
).toUpperCase();

const isBookingNotification = (value) => {
  const source = value?.notification && typeof value.notification === "object"
    ? value.notification
    : value;
  const type = String(source?.type || source?.eventType || source?.kind || "").toLowerCase();
  const text = String(
    source?.message || source?.text || source?.content || source?.body || ""
  ).toLowerCase();
  return type.includes("booking") || text.includes("booking request") || text.includes("booking was");
};

const bookingNotificationText = (source, role) => {
  const rawText = String(source?.message || source?.text || source?.content || source?.body || "").toLowerCase();
  let status = bookingStatusOf(source);
  if (!status) {
    if (rawText.includes("accepted") || rawText.includes("confirmed")) status = "ACCEPTED";
    else if (rawText.includes("rejected") || rawText.includes("declined")) status = "REJECTED";
    else if (rawText.includes("cancelled") || rawText.includes("canceled")) status = "CANCELLED";
    else if (rawText.includes("pending") || rawText.includes("created")) status = "PENDING";
  }
  const title = bookingTripTitleOf(source);
  const type = String(source?.type || source?.eventType || source?.kind || "").toLowerCase();

  if (role === "owner") {
    if (type.includes("received") || !status || status === "PENDING") {
      return `You have a new booking request for ${title}.`;
    }
    if (status === "CONFIRMED" || status === "ACCEPTED") {
      return `A booking request for ${title} has been accepted.`;
    }
    if (status === "REJECTED" || status === "DECLINED") {
      return `A booking request for ${title} has been declined.`;
    }
    if (status === "CANCELLED" || status === "CANCELED") {
      return `A booking for ${title} has been cancelled.`;
    }
    return `There is an update to a booking for ${title}.`;
  }

  if (status === "CONFIRMED" || status === "ACCEPTED") {
    return "Your booking request has been accepted.";
  }
  if (status === "REJECTED" || status === "DECLINED") {
    return "Your booking request has been declined.";
  }
  if (status === "CANCELLED" || status === "CANCELED") {
    return "Your booking has been cancelled.";
  }
  return "Your booking request has been submitted and is pending approval.";
};

const bookingRoleFor = (source, incomingSet, mineSet) => {
  const bookingId = bookingIdOf(source);
  const key = bookingId ? String(bookingId) : null;
  if (key && incomingSet.has(key)) return "owner";
  if (key && mineSet.has(key)) return "buyer";
  const type = String(source?.type || source?.eventType || source?.kind || "").toLowerCase();
  if (type.includes("received") || type.includes("owner") || type.includes("host")) return "owner";
  if (type.includes("mine") || type.includes("buyer") || type.includes("traveler")) return "buyer";
  return null;
};

const chatList = (response) => {
  const root = unwrap(response);
  if (Array.isArray(root)) return root;
  return getList(response, ["chats", "conversations", "items", "results"]);
};

const latestMessageOf = (chat) => {
  const candidates = [
    chat?.lastMessage,
    chat?.latestMessage,
    chat?.last_message,
    chat?.message,
  ].filter(Boolean);

  if (Array.isArray(chat?.messages)) {
    candidates.push(...chat.messages.slice(-5));
  }

  if (!candidates.length && chat?.lastMessageText) {
    candidates.push({
      text: chat.lastMessageText,
      createdAt: chat.lastMessageAt,
      sender: chat.lastMessageSender,
    });
  }

  return candidates.sort((a, b) => timeOf(b) - timeOf(a))[0] || null;
};

const normalizeActivity = (raw, fallbackType = "activity") => {
  if (!raw) return null;

  const source =
    raw?.notification && typeof raw.notification === "object"
      ? raw.notification
      : raw;

  const type = String(
    source?.type || source?.eventType || source?.kind || fallbackType || "activity"
  ).toLowerCase();

  const sender =
    source?.sender?.name ||
    (typeof source?.sender === "string" ? source.sender : null) ||
    source?.senderName ||
    source?.user?.name ||
    source?.actor?.name ||
    source?.fromUser?.name ||
    source?.from?.name ||
    source?.message?.sender?.name ||
    "Tripora";

  return {
    id: idOf(source) || source?.notificationId || null,
    messageId:
      source?.messageId || source?.message?._id || source?.message?.id || null,
    chatId:
      source?.chatId ||
      source?.conversationId ||
      source?.chat?._id ||
      source?.chat?.id ||
      null,
    entityId:
      source?.tripId ||
      source?.postId ||
      source?.bookingId ||
      source?.entityId ||
      null,
    type,
    sender,
    text: textOf(source),
    at: timeOf(source),
    read: Boolean(source?.read || source?.isRead),
    raw: source,
  };
};

const keyOf = (item) =>
  `${item?.type || "activity"}:${item?.chatId || item?.entityId || "x"}:${
    item?.messageId || item?.id || item?.at || "x"
  }`;

const iconFor = (type) => {
  const safeType = String(type || "activity").toLowerCase();
  if (safeType.includes("message")) return MessageCircle;
  if (safeType.includes("like") || safeType.includes("favorite")) return Heart;
  if (safeType.includes("book")) return CalendarCheck;
  return Info;
};

export default function RealtimeNotifications() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const uid = idOf(user);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const bookingRoleRef = useRef({ incoming: new Set(), mine: new Set() });
  const seenRef = useRef(new Set());
  const baselineRef = useRef({
    posts: null,
    incomingBookings: null,
    myBookings: null,
    chats: null,
  });

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    seenRef.current.clear();
    baselineRef.current = { posts: null, incomingBookings: null, myBookings: null, chats: null };
    bookingRoleRef.current = { incoming: new Set(), mine: new Set() };
  }, [uid]);
  const notificationStorageKey = `tripora-notifications:${uid || "guest"}`;
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(notificationStorageKey) || "[]"
      );
      const normalized = Array.isArray(stored)
        ? stored.map((item) => normalizeActivity(item)).filter(Boolean)
        : [];
      normalized.forEach((item) => seenRef.current.add(keyOf(item)));
      return normalized;
    } catch {
      return [];
    }
  });

  const persist = useCallback((next) => {
    try {
      localStorage.setItem(notificationStorageKey, JSON.stringify(next));
    } catch {
      // Storage is optional.
    }
  }, [notificationStorageKey]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(notificationStorageKey) || "[]");
      const normalized = Array.isArray(stored) ? stored.map((item) => normalizeActivity(item)).filter(Boolean) : [];
      normalized.forEach((item) => seenRef.current.add(keyOf(item)));
      setItems(normalized);
      setUnread(normalized.filter((item) => !item.read).length);
    } catch {
      setItems([]);
    }
  }, [notificationStorageKey]);

  const addActivity = useCallback(
    (raw, explicitChatId = null, fallbackType = "activity", silent = false) => {
      const item = normalizeActivity(raw, fallbackType);
      if (!item) return;

      item.chatId = item.chatId || explicitChatId;

      const senderId = senderOf(item.raw);
      if (senderId && uid && String(senderId) === String(uid)) return;

      const key = keyOf(item);
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);

      setItems((previous) => {
        const next = [
          item,
          ...previous.filter((oldItem) => keyOf(oldItem) !== key),
        ]
          .sort((a, b) => b.at - a.at)
          .slice(0, 80);
        persist(next);
        return next;
      });

      setUnread((count) => count + 1);

      if (!silent) {
        toast(item.text, {
          icon: String(item.type).includes("message") ? "💬" : "🔔",
        });
      }

      window.dispatchEvent(
        new CustomEvent("tripora:notification", { detail: item })
      );
    },
    [persist, uid]
  );

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !uid) return;

    // Load the backend notification feed first. This is the authoritative
    // source for likes, bookings, messages and other server-side events.
    // Local/activity fallbacks below remain useful for deployments that do not
    // provide the feed yet.
    try {
      const response = await getNotifications();
      const serverItems = getList(response, ["notifications", "items", "results"]);
      if (serverItems.length) {
        const normalized = serverItems
          .map((entry) => normalizeActivity(entry, entry?.type || "activity"))
          .filter(Boolean)
          .map((item) => ({
            ...item,
            read: Boolean(item.raw?.read || item.raw?.isRead),
          }));

        setItems((previous) => {
          const merged = [...normalized, ...previous]
            .filter(Boolean)
            .sort((a, b) => b.at - a.at)
            .filter((item, index, all) => keyOf(item) && all.findIndex((other) => keyOf(other) === keyOf(item)) === index)
            .slice(0, 80);
          persist(merged);
          return merged;
        });
        setUnread(normalized.filter((item) => !item.read).length);
      }
    } catch {
      // The fallback activity sources below can still populate notifications.
    }

    // Favorites/likes fallback.
    try {
      const posts = await fetchAllPages((page, limit) => getMyPosts({ page, limit }), ["trips", "posts", "items", "results"], { limit: 100, maxPages: 50 });
      const snapshot = Object.fromEntries(
        posts.map((post) => [
          String(idOf(post)),
          { favorites: Number(post?.favoriteCount ?? post?.likesCount ?? 0), status: String(post?.status || "").toUpperCase() }
        ])
      );

      if (baselineRef.current.posts) {
        Object.entries(snapshot).forEach(([postId, current]) => {
          const before = baselineRef.current.posts[postId] || { favorites: 0, status: "" };
          if (current.favorites > before.favorites) {
            addActivity({ type: "favorite", tripId: postId, sender: "Someone", text: `Someone liked your trip. You now have ${current.favorites} favorite${current.favorites === 1 ? "" : "s"}.` }, null, "favorite");
          }
          if (before.status && current.status && before.status !== current.status) {
            addActivity({ type: "post_status", tripId: postId, sender: "Tripora", text: `Your trip status changed from ${before.status} to ${current.status}.` }, null, "post_status");
          }
        });
      }
      baselineRef.current.posts = snapshot;
    } catch {
      // Optional fallback.
    }

    // Host booking notifications: the seller-owned endpoint is scoped to
    // bookings for trips owned by the authenticated user. Notify the trip
    // owner with a clear, professional incoming-booking message.
    try {
      const incoming = await fetchAllPages((page, limit) => getOwnedBookings({ page, limit }), ["bookings", "items", "results"], { limit: 100, maxPages: 20 });
      const snapshot = Object.fromEntries(incoming.map((booking) => [
        String(idOf(booking)),
        {
          status: String(booking?.status || "PENDING").toUpperCase(),
          tripId: booking?.tripId?._id || booking?.tripId?.id || booking?.tripId || booking?.trip?._id || booking?.trip?.id || booking?.postId?._id || booking?.postId?.id || booking?.postId || booking?.post?._id || booking?.post?.id || null,
          tripTitle: booking?.trip?.title || booking?.tripId?.title || booking?.post?.title || booking?.postId?.title || "your trip"
        }
      ]));
      if (baselineRef.current.incomingBookings) {
        Object.entries(snapshot).forEach(([bookingId, current]) => {
          if (!baselineRef.current.incomingBookings[bookingId]) {
            addActivity({
              type: "booking_received",
              bookingId,
              tripId: current.tripId,
              sender: "Tripora",
              text: `You have a new booking request for ${current.tripTitle}.`
            }, null, "booking_received");
          }
        });
      }
      bookingRoleRef.current.incoming = new Set(Object.keys(snapshot));
      baselineRef.current.incomingBookings = snapshot;
    } catch { /* seller booking notifications are optional */ }

    // Buyer booking notifications: detect approval/rejection/cancellation
    // changes on the user's own bookings.
    try {
      const mineAll = await fetchAllPages((page, limit) => getBookings({ page, limit }), ["bookings", "items", "results"], { limit: 100, maxPages: 20 });
      // Some deployments return a broader booking collection here. Keep only bookings
      // made by the authenticated user so owners never receive buyer-style notifications
      // for incoming requests. Unknown owner/requester fields are left intact rather
      // than discarded, because the documented buyer endpoint is already user-scoped.
      const mine = mineAll.filter((booking) => {
        const owner = ownerIdOf(booking);
        const requester = requesterIdOf(booking);
        if (owner && String(owner) === String(uid)) return false;
        return !requester || String(requester) === String(uid);
      });
      const snapshot = Object.fromEntries(mine.map((booking) => [
        String(idOf(booking)),
        { status: String(booking?.status || "").toUpperCase(), updatedAt: timeOf(booking), tripId: booking?.tripId || booking?.trip?._id || booking?.postId || null }
      ]));
      if (baselineRef.current.myBookings) {
        Object.entries(snapshot).forEach(([bookingId, current]) => {
          const before = baselineRef.current.myBookings[bookingId];
          if (!before) addActivity({ type: "booking", bookingId, tripId: current.tripId, sender: "Tripora", text: `Your booking request has been submitted and is pending approval.` }, null, "booking");
          else if (before.status !== current.status) {
            const statusText = current.status === "CONFIRMED" || current.status === "ACCEPTED"
              ? "Your booking request has been accepted."
              : current.status === "REJECTED" || current.status === "DECLINED"
                ? "Your booking request has been declined."
                : current.status === "CANCELLED" || current.status === "CANCELED"
                  ? "Your booking has been cancelled."
                  : `Your booking status has been updated to ${current.status || "UPDATED"}.`;
            addActivity({ type: "booking_status", bookingId, tripId: current.tripId, sender: "Tripora", text: statusText }, null, "booking_status");
          }
        });
      }
      bookingRoleRef.current.mine = new Set(Object.keys(snapshot));
      baselineRef.current.myBookings = snapshot;

      // Re-label persisted/live booking notifications once both role sets are known.
      // This prevents an old generic buyer message from remaining visible to the trip owner.
      setItems((previous) => {
        let changed = false;
        const next = previous.map((item) => {
          if (!isBookingNotification(item?.raw)) return item;
          const role = bookingRoleFor(item?.raw, bookingRoleRef.current.incoming, bookingRoleRef.current.mine);
          if (!role) return item;
          const text = bookingNotificationText(item.raw, role);
          if (text === item.text) return item;
          changed = true;
          return { ...item, text };
        });
        if (changed) persist(next);
        return changed ? next : previous;
      });
    } catch { /* buyer booking route may be unavailable */ }

    // Chat fallback.
    try {
      const chats = chatList(await getChats());
      let totalUnread = 0;

      const chatSnapshot = {};
      for (const chat of chats) {
        const count = Number(chat?.unreadCount ?? 0);
        if (Number.isFinite(count)) totalUnread += count;

        const chatId = chatIdOf(chat);
        let latest = latestMessageOf(chat);
        let incomingLatest = null;

        // When a conversation has unread messages, load its message history so
        // the notification contains the actual incoming message instead of a
        // badge with no corresponding notification row.
        if (chatId) {
          try {
            const response = await getChatMessages(chatId);
            const root = unwrap(response);
            const messages = Array.isArray(root) ? root : root?.messages || root?.chatMessages || root?.items || [];
            const sorted = [...messages].sort((a,b) => timeOf(b) - timeOf(a));
            if (!latest) latest = sorted[0] || null;
            incomingLatest = sorted.find((message) => {
              const senderId = senderOf(message);
              return !senderId || !uid || String(senderId) !== String(uid);
            }) || null;
          } catch { /* summary data can still be used below */ }
        }

        const candidate = incomingLatest || latest;
        chatSnapshot[String(chatId || idOf(chat))] = { messageId: idOf(candidate), at: timeOf(candidate), text: textOf(candidate) };

        if (count > 0 && chatId) {
          if (incomingLatest) {
            addActivity(incomingLatest, chatId, "message", true);
          } else {
            addActivity({ type: "message", chatId, text: `You have ${count} unread message${count === 1 ? "" : "s"}.` }, chatId, "message", true);
          }
        } else if (candidate && (!senderOf(candidate) || !uid || String(senderOf(candidate)) !== String(uid))) {
          const previous = baselineRef.current.chats?.[String(chatId || idOf(chat))];
          if (previous && (previous.messageId !== idOf(candidate) || previous.at !== timeOf(candidate))) {
            addActivity(candidate, chatId, "message", true);
          }
        }
      }
      baselineRef.current.chats = chatSnapshot;

      setUnread((current) => Math.max(current, totalUnread));
    } catch {
      // Chat endpoint failures must not break notifications.
    }
  }, [addActivity, isAuthenticated, persist, uid]);

  useEffect(() => {
    if (!isAuthenticated || !uid) {
      setUnread(0);
      return undefined;
    }

    refreshNotifications();
    const poll = window.setInterval(refreshNotifications, 5000);
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    const socket = createChatSocket(token);
    socketRef.current = socket;

    if (!socket) {
      return () => window.clearInterval(poll);
    }

    const onNewMessage = (payload) => {
      const message = payload?.message || payload;
      addActivity(message, payload?.chatId, "message");
    };

    const onNotification = (payload) => {
      if (isBookingNotification(payload)) {
        const source = payload?.notification && typeof payload.notification === "object"
          ? payload.notification
          : payload;
        const bookingId = bookingIdOf(source);
        const key = bookingId ? String(bookingId) : null;
        const role = bookingRoleFor(source, bookingRoleRef.current.incoming, bookingRoleRef.current.mine) || "buyer";
        addActivity({
          ...source,
          type: source?.type || source?.eventType || "booking_status",
          bookingId: bookingId || source?.bookingId,
          text: bookingNotificationText(source, role),
        }, payload?.chatId, source?.type || source?.eventType || "booking_status");
        return;
      }
      addActivity(payload, payload?.chatId, payload?.type || "activity");
    };

    const onRefresh = () => refreshNotifications();

    socket.on("connect", () => {
      socket.emit("join_user", { userId: uid });
    });
    socket.on("message:new", onNewMessage);
    socket.on("new_message", onNewMessage);
    socket.on("notification:new", onNotification);
    socket.on("conversation:updated", onRefresh);
    socket.on("message:delivered", onRefresh);

    return () => {
      window.clearInterval(poll);
      socket.off("message:new", onNewMessage);
      socket.off("new_message", onNewMessage);
      socket.off("notification:new", onNotification);
      socket.off("conversation:updated", onRefresh);
      socket.off("message:delivered", onRefresh);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [addActivity, isAuthenticated, refreshNotifications, uid]);

  useEffect(() => {
    const handler = () => refreshNotifications();
    window.addEventListener("tripora:chat-read", handler);
    return () => window.removeEventListener("tripora:chat-read", handler);
  }, [refreshNotifications]);

  if (!isAuthenticated) return null;

  const unreadItems = items.filter((item) => !item.read).length;
  const badge = Math.min(99, Math.max(unread, unreadItems));

  const markNotificationsRead = async () => {
    setUnread(0);

    const next = items.map((item) => ({ ...item, read: true }));
    setItems(next);
    persist(next);

    await Promise.all(next.map(async (item) => {
      const notificationId = item?.id;
      if (notificationId) {
        try { await markNotificationRead(notificationId); } catch { /* optional */ }
      }
      if (item?.chatId) {
        try { await markChatRead(item.chatId); } catch { /* optional */ }
      }
    }));
  };

  const openNotification = (item) => {
    setOpen(false);

    if (item.chatId) {
      navigate(`/chat?chatId=${encodeURIComponent(item.chatId)}`);
      return;
    }

    if (item.entityId && String(item.type).includes("book")) {
      navigate(`/bookings`);
      return;
    }

    if (item.entityId) {
      navigate(`/trips/${encodeURIComponent(item.entityId)}`);
    }
  };

  return (
    <div className="relative tripora-notification-root">
      <button
        type="button"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) markNotificationsRead();
        }}
        className="relative grid h-10 w-10 min-h-10 min-w-10 place-items-center rounded-xl border border-[#263746] tp-control transition hover:brightness-95"
      >
        <Bell size={17} />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#ef6f6f] px-1 text-[9px] font-black text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="tp-menu tp-notification-menu absolute right-0 top-[calc(100%+10px)] z-[120] w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border shadow-[0_25px_70px_rgba(0,0,0,.2)]">
          <div className="flex items-center justify-between border-b border-[#1d2d39] px-4 py-3">
            <div>
              <p className="text-sm font-extrabold tp-heading">Notifications</p>
              <p className="text-[11px] tp-muted">
                Messages, likes, favorites, bookings and updates
              </p>
            </div>
            <CheckCheck size={16} className="text-[#75d8a4]" />
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            {!items.length ? (
              <div className="px-4 py-10 text-center text-xs tp-muted">
                <Bell className="mx-auto mb-2" size={24} />
                <p>No notifications yet</p>
              </div>
            ) : (
              items.map((item) => {
                const Icon = iconFor(item?.type);
                return (
                  <button
                    key={keyOf(item)}
                    type="button"
                    onClick={() => openNotification(item)}
                    className="flex w-full gap-3 border-b border-[#1d2d39] px-4 py-3 text-left transition hover:bg-black/[.04]"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#123b30] text-[#9ee8c0]">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold tp-heading">
                        {item?.sender || "Tripora"}
                      </span>
                      <span className="mt-0.5 block whitespace-normal break-words text-xs tp-muted">
                        {isBookingNotification(item?.raw)
                          ? bookingNotificationText(item?.raw, bookingRoleFor(item?.raw, bookingRoleRef.current.incoming, bookingRoleRef.current.mine) || "buyer")
                          : (item?.text || "New activity")}
                      </span>
                      <span className="mt-1 block text-[10px] tp-muted">
                        {new Date(item?.at || Date.now()).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
