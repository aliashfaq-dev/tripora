import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
/* eslint-disable react-hooks/set-state-in-effect */
import { ArrowLeft, Ban, Check, MessageCircle, RefreshCw, Send, ShoppingBag, Store, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { blockChatPerson, unblockChatPerson, getBlockedUsers, deleteChat, getChats, getChatMessages, sendChatMessage, markChatRead } from "../api/chat";
import { createChatSocket } from "../api/socket";
import { getMyPosts } from "../api/posts";
import { getList, apiError } from "../api/response";
import { fetchAllPages } from "../api/pagination";
import ConfirmDialog from "../components/ConfirmDialog";

const idOf = (x) => {
  if (x == null) return null;
  if (typeof x === "string" || typeof x === "number") return x;
  return x?._id || x?.id || x?.userId || x?.user?._id || x?.user?.id || null;
};
const participant = (chat, userId) => {
  const participants = Array.isArray(chat?.participants) ? chat.participants : [];
  const peer = participants.find((p) => {
    const pid = idOf(p);
    return pid != null && String(pid) !== String(userId);
  });
  return peer || {};
};
const ownerOf = (chat) => chat?.trip?.ownerId || chat?.trip?.owner || chat?.trip?.createdBy || chat?.ownerId || chat?.seller || chat?.trip?.user;
const tripIdOf = (chat) => chat?.trip?._id || chat?.trip?.id || chat?.tripId || chat?.postId;
const buyerSuggestions = ["Is this trip available?", "Which dates are available?", "I'd like to book this trip."];
const sellerSuggestions = ["Yes, this trip is available.", "Which dates would you like?", "How many travelers are you booking for?"];
const normalizeMessage = (payload) => payload?.message && typeof payload.message === "object" ? payload.message : payload;
const messageStatus = (message) => {
  const raw = String(message?.status || message?.deliveryStatus || "").toUpperCase();
  if (message?.isRead === true || raw === "READ" || raw === "SEEN") return "read";
  if (raw === "DELIVERED" || message?.deliveredAt) return "delivered";
  return "sent";
};
const listFromAny = (value, keys = []) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  for (const key of ["data", "result", "response", "chat", "conversation"]) {
    const found = listFromAny(value?.[key], keys);
    if (found.length) return found;
  }
  return [];
};
const chatCacheKey = (uid, chatId) => `tripora-chat-messages:${uid}:${chatId}`;
const readCachedMessages = (uid, chatId) => {
  try { return JSON.parse(localStorage.getItem(chatCacheKey(uid, chatId)) || "[]"); } catch { return []; }
};
const writeCachedMessages = (uid, chatId, value) => {
  try { localStorage.setItem(chatCacheKey(uid, chatId), JSON.stringify(value.slice(-300))); } catch {}
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const requestedChatId = searchParams.get("chatId");
  const requestedMode = searchParams.get("mode") === "selling" ? "selling" : "buying";
  const { user } = useSelector((state) => state.auth);
  const uid = idOf(user);
  const [chats, setChats] = useState([]);
  const [myPostIds, setMyPostIds] = useState(new Set());
  const [mode, setMode] = useState(requestedMode);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const [chatAction, setChatAction] = useState("");
  const socket = useRef(null);
  const bottom = useRef(null);
  const messageScroller = useRef(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [blockedByOther, setBlockedByOther] = useState(false);

  const isSellingChat = (chat) => {
    // Prefer the backend's explicit conversation type when available.
    // This prevents a buying conversation from leaking into Selling (or vice versa)
    // when owner/trip metadata is incomplete or populated differently.
    const type = String(
      chat?.conversationType ||
      chat?.conversation_type ||
      chat?.type ||
      chat?.mode ||
      ""
    ).trim().toUpperCase();
    if (type === "SELLING" || type === "SELL") return true;
    if (type === "BUYING" || type === "BUY") return false;

    const owner = ownerOf(chat);
    const ownerId = idOf(owner) || owner;
    const tripId = tripIdOf(chat);
    return (ownerId && String(ownerId) === String(uid)) || (tripId && myPostIds.has(String(tripId)));
  };

  const buyingChats = useMemo(() => chats.filter((chat) => !isSellingChat(chat)), [chats, myPostIds, uid]);
  const sellingChats = useMemo(() => chats.filter((chat) => isSellingChat(chat)), [chats, myPostIds, uid]);
  const filteredChats = mode === "selling" ? sellingChats : buyingChats;

  const loadChats = async () => {
    setLoading(true);
    try {
      const [chatResponse, postsResponse] = await Promise.allSettled([getChats(), fetchAllPages((page, limit) => getMyPosts({ page, limit }), ["trips", "posts", "items", "results"], { limit: 100, maxPages: 50 })]);
      if (chatResponse.status === "fulfilled") setChats(listFromAny(chatResponse.value, ["chats", "conversations", "items", "results"]));
      else setChats([]);
      if (postsResponse.status === "fulfilled") {
        const posts = postsResponse.value || [];
        setMyPostIds(new Set(posts.map((p) => String(idOf(p))).filter(Boolean)));
      }
      setError("");
    } catch (e) { setError(apiError(e, "Could not load conversations.")); }
    finally { setLoading(false); }
  };

  const loadBlockedUsers = async () => {
    try {
      const response = await getBlockedUsers();
      const raw = listFromAny(response, ["blockedUsers", "blocked", "users", "items", "results"]);
      const ids = raw.map((item) => idOf(item) || item?.userId || item?.blockedUserId || item?.blocked?._id || item?.blocked?.id).filter(Boolean).map(String);
      setBlockedIds(new Set(ids));
    } catch {
      // Blocking remains backend-enforced even if the optional list endpoint is unavailable.
    }
  };

  useEffect(() => { setMode(requestedMode); }, [requestedMode]);
  useEffect(() => { loadChats(); loadBlockedUsers(); return () => socket.current?.disconnect?.(); }, [requestedChatId]);

  useEffect(() => {
    if (requestedChatId && chats.length) {
      // Never allow a chat opened from the other mode to appear in this mode.
      const requested = filteredChats.find((chat) => String(idOf(chat)) === String(requestedChatId));
      if (requested) setSelected(requested);
      else if (selected && !filteredChats.some((chat) => String(idOf(chat)) === String(idOf(selected)))) setSelected(filteredChats[0] || null);
      return;
    }
    if (selected && filteredChats.some((chat) => String(idOf(chat)) === String(idOf(selected)))) return;
    setSelected(filteredChats[0] || null);
  }, [requestedChatId, chats, filteredChats]);

  const loadMessages = async (showLoader = true) => {
    if (!selected) return;
    const chatId = idOf(selected);
    if (showLoader) setMessagesLoading(true);
    try {
      const response = await getChatMessages(chatId);
      const serverMessages = listFromAny(response, ["messages", "chatMessages", "items"]);
      markChatRead(chatId).catch(() => {});
      socket.current?.emit("messages:read", { chatId });
      socket.current?.emit("chat:read", { chatId });
      window.dispatchEvent(new CustomEvent("tripora:chat-read"));
      const normalized = serverMessages.map(normalizeMessage).filter(Boolean);
      if (normalized.length) {
        setMessages(normalized);
        writeCachedMessages(uid, chatId, normalized);
      } else {
        // Keep the conversation visible across refreshes if the deployed API returns an empty wrapper.
        const cached = readCachedMessages(uid, chatId);
        setMessages(cached);
      }
      setError("");
    } catch (e) {
      const cached = readCachedMessages(uid, chatId);
      if (cached.length) { setMessages(cached); setError(""); }
      else setError(apiError(e, "Could not load messages."));
    } finally { if (showLoader) setMessagesLoading(false); }
  };

  useEffect(() => {
    if (!selected) return undefined;
    setBlockedByOther(false);
    let mounted = true;
    loadMessages(true);
    const poll = window.setInterval(() => { if (mounted) loadMessages(false); }, 3000);
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const s = createChatSocket(token);
    socket.current = s;
    if (s) {
      s.on("connect", () => s.emit("join_chat", { chatId: idOf(selected) }));
      const add = (payload) => { const msg = normalizeMessage(payload); if (!msg) return; const incomingChatId = payload?.chatId || msg?.chatId || msg?.chat; if (incomingChatId && String(incomingChatId) !== String(idOf(selected))) return; setMessages((prev) => prev.some((x) => String(idOf(x)) === String(idOf(msg))) ? prev : [...prev, msg]); };
      const updateStatus = (payload, status) => {
        const raw = normalizeMessage(payload);
        const targetId = idOf(raw) || payload?.messageId;
        if (!targetId) return;
        setMessages((prev) => prev.map((m) => String(idOf(m)) === String(targetId) ? { ...m, status, ...(status === "read" ? { isRead: true } : {}) } : m));
      };
      s.on("message:new", add);
      s.on("new_message", add);
      s.on("message:delivered", (payload) => updateStatus(payload, "delivered"));
      s.on("message:read", (payload) => updateStatus(payload, "read"));
      s.on("conversation:updated", () => { loadChats(); loadMessages(false); });
      s.on("user_typing", (payload) => setTyping(Boolean(payload?.isTyping)));
    }
    return () => { mounted = false; window.clearInterval(poll); if (s) { s.emit("leave_chat", { chatId: idOf(selected) }); s.disconnect(); } if (socket.current === s) socket.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    const el = messageScroller.current;
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, selected]);
  const peer = useMemo(() => participant(selected, uid), [selected, uid]);
  const selectedIsSelling = selected ? isSellingChat(selected) : mode === "selling";
  const lastIncoming = [...messages].reverse().find((message) => {
    const senderId = message?.sender?._id || message?.sender?.id || message?.sender;
    return senderId && String(senderId) !== String(uid);
  });
  const lastIncomingText = String(lastIncoming?.text || lastIncoming?.content || lastIncoming?.message || lastIncoming?.body || "").toLowerCase();
  const suggestions = selectedIsSelling
    ? (lastIncomingText.includes("available") || lastIncomingText.includes("availability") ? ["Yes, this trip is available.", "Which dates would you like?", "How many travelers are you booking for?"] : sellerSuggestions)
    : (lastIncomingText.includes("available") || lastIncomingText.includes("availability") ? ["Is this trip available?", "Which dates are available?", "I'd like to book this trip."] : buyerSuggestions);

  const peerId = idOf(peer);
  const blockedByMe = Boolean(peerId && blockedIds.has(String(peerId)));
  const peerMarkedBlocked = Boolean(
    selected?.blockedByOther === true || selected?.blockedByRecipient === true ||
    peer?.blockedByMe === true
  );
  const cannotMessage = blockedByMe || blockedByOther || peerMarkedBlocked;

  const send = async () => {
    const content = text.trim(); if (!content || !selected) return;
    if (cannotMessage) { toast.error(blockedByMe ? "This person is blocked. Unblock them to send messages." : "Failed to deliver message — messaging is blocked between you and this person."); return; }
    const chatId = idOf(selected);
    setText("");
    try {
      const response = await sendChatMessage(chatId, content);
      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const msg = normalizeMessage(root?.message || root?.item || root);
      if (msg && (msg.content || msg.text || msg.message || msg.body)) {
        setMessages((prev) => {
          const next = prev.some((x) => String(idOf(x)) === String(idOf(msg))) ? prev : [...prev, msg];
          writeCachedMessages(uid, chatId, next);
          return next;
        });
        loadChats();
      } else {
        await loadMessages(false);
        loadChats();
      }
    } catch (e) {
      setText(content);
      const status = e?.response?.status;
      const raw = JSON.stringify(e?.response?.data || "").toLowerCase();
      const blocked = /\b(blocked|blocking|block list|blocked user)\b/.test(raw);
      if (blocked) setBlockedByOther(true);
      toast.error(blocked ? "Failed to deliver message — this user is blocked and cannot receive your messages." : apiError(e, "Message could not be sent."));
    }
  };

  const removeConversation = async () => {
    if (!selected || chatAction) return;
    const chatId = idOf(selected);
    setConfirmAction({ type: "delete", chatId });
  };

  const confirmDeleteConversation = async () => {
    if (!selected || chatAction) return;
    const chatId = idOf(selected);
    setConfirmAction(null);
    setChatAction("delete");
    try {
      await deleteChat(chatId);
      localStorage.removeItem(chatCacheKey(uid, chatId));
      setChats((prev) => prev.filter((chat) => String(idOf(chat)) !== String(chatId)));
      setSelected(null);
      setMessages([]);
      toast.success("Conversation deleted.");
    } catch (e) { toast.error(apiError(e, "Could not delete this chat.")); }
    finally { setChatAction(""); }
  };

  const blockPerson = async () => {
    if (!selected || chatAction) return;
    const chatId = idOf(selected);
    const peerId = idOf(peer);
    setConfirmAction({ type: "block", chatId, peerId, name: peer?.name || peer?.email || "this person" });
  };

  const confirmBlockPerson = async () => {
    if (!selected || chatAction) return;
    const chatId = idOf(selected);
    const peerId = idOf(peer);
    setConfirmAction(null);
    setChatAction("block");
    try {
      await blockChatPerson(peerId);
      setBlockedIds((prev) => new Set([...prev, String(peerId)]));
      setBlockedByOther(false);
      toast.success("Person blocked. Unblock them to resume messaging.");
    } catch (e) { toast.error(apiError(e, "Could not update the block status.")); }
    finally { setChatAction(""); }
  };

  const unblockPerson = async () => {
    if (!peerId || chatAction) return;
    setChatAction("unblock");
    try {
      await unblockChatPerson(peerId);
      setBlockedIds((prev) => { const next = new Set(prev); next.delete(String(peerId)); return next; });
      setBlockedByOther(false);
      toast.success("Person unblocked. You can message each other again.");
      await loadChats();
    } catch (e) { toast.error(apiError(e, "Could not unblock this person.")); }
    finally { setChatAction(""); }
  };

  return <Layout><section className="chat-page-shell mx-auto max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <div className="chat-page-heading mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#75d8a4]">Messages</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-.03em] text-white">Buying & Selling</h2><p className="mt-1 text-sm text-[#6f8589]">Keep customer conversations and trip-owner conversations separated.</p></div><button onClick={loadChats} className="tp-chat-refresh grid h-9 w-9 place-items-center rounded-lg" title="Refresh"><RefreshCw size={15}/></button></div>

    <div className="chat-mode-shell mb-4 grid grid-cols-2 gap-2 rounded-2xl p-1.5 sm:max-w-md"><button type="button" onClick={()=>setMode("buying")} className={`chat-mode-button flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${mode==="buying"?"chat-mode-active":"chat-mode-inactive"}`}><ShoppingBag size={16}/> Buying <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[10px]">{buyingChats.length}</span></button><button type="button" onClick={()=>setMode("selling")} className={`chat-mode-button flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${mode==="selling"?"chat-mode-active":"chat-mode-inactive"}`}><Store size={16}/> Selling <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[10px]">{sellingChats.length}</span></button></div>

    <div className="chat-shell grid h-[calc(100dvh-220px)] min-h-[560px] min-h-0 overflow-hidden rounded-2xl border border-[#233543] bg-[#0c1824] md:grid-cols-[290px_1fr]">
      <aside className={`${selected ? "hidden md:flex" : "flex"} min-w-0 flex-col border-r border-[#233543] bg-[#0a1621]`}><div className="border-b border-[#233543] px-4 py-4"><p className="text-xs font-bold text-[#91a7a1]">{mode === "selling" ? "Selling conversations" : "Buying conversations"}</p><p className="mt-1 text-[11px] text-[#61777d]">{mode === "selling" ? "People interested in your posted trips." : "Trip owners you contacted."}</p></div><div className="flex-1 overflow-y-auto">{loading?<p className="p-5 text-sm text-[#71878b]">Loading conversations...</p>:null}{!loading&&!filteredChats.length?<div className="p-6 text-center text-sm text-[#71878b]"><MessageCircle className="mx-auto mb-3" size={26}/><p>No {mode} conversations yet.</p><p className="mt-1 text-xs">{mode === "selling" ? "When someone contacts you about your trip, it will appear here." : "Open a trip and choose Message owner."}</p></div>:null}{filteredChats.map((chat)=>{const p=participant(chat,uid);const active=String(idOf(chat))===String(idOf(selected));return <button key={idOf(chat)} onClick={()=>setSelected(chat)} className={`chat-list-item flex w-full items-center gap-3 border-b border-[#182a36] px-4 py-3.5 text-left ${active?"active bg-[#102a23]":"hover:bg-white/[.025]"}`}><span className="chat-avatar h-9 w-9 shrink-0 text-xs">{(p.name||p.email||"?")[0].toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#e8f1ee]">{p.name||p.email||"Conversation"}</span><span className="mt-0.5 block truncate text-xs text-[#6e8589]">{chat.trip?.title||chat.lastMessage?.content||chat.lastMessage?.text||chat.lastMessageText||"No messages yet"}</span></span></button>})}</div></aside>

      <main className={`${selected?"flex":"hidden md:flex"} min-w-0 min-h-0 flex-col bg-[#0c1824]`}>{!selected?<div className="grid flex-1 place-items-center text-center text-[#6f8589]"><div><MessageCircle className="mx-auto" size={42} strokeWidth={1.4}/><p className="mt-3 text-sm">Choose a conversation</p></div></div>:<><header className="flex h-[68px] items-center gap-3 border-b border-[#233543] px-4 sm:px-5"><button onClick={()=>setSelected(null)} className="grid h-8 w-8 place-items-center rounded-lg text-[#8da1a4] hover:bg-white/[.04] md:hidden"><ArrowLeft size={17}/></button><span className="chat-avatar h-9 w-9 text-xs">{(peer.name||peer.email||"?")[0].toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{peer.name||peer.email||"Conversation"}</p><p className="text-[11px] text-[#6f8589]">{mode === "selling" ? "Customer inquiry" : "Trip owner"} {typing?"· typing…":""}</p></div><div className="ml-auto flex items-center gap-1">{blockedByMe ? <button type="button" onClick={unblockPerson} disabled={Boolean(chatAction)} className="chat-icon-action" title="Unblock person"><Ban size={16}/></button> : <button type="button" onClick={blockPerson} disabled={Boolean(chatAction)} className="chat-icon-action" title="Block person"><Ban size={16}/></button>}<button type="button" onClick={removeConversation} disabled={Boolean(chatAction)} className="chat-icon-action chat-delete-action" title="Delete conversation"><Trash2 size={16}/></button></div></header>{cannotMessage && <div className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 sm:mx-6">
  <p className="font-bold">Messaging is blocked</p>
  <p className="mt-1">{blockedByMe ? "You blocked this person. Unblock them to send or receive messages again." : "This person has blocked messaging with you. Messages cannot be delivered."}</p>
  {blockedByMe && <button type="button" onClick={unblockPerson} disabled={Boolean(chatAction)} className="mt-2 rounded-lg bg-[#9ee8c0] px-3 py-1.5 text-[11px] font-extrabold text-[#06251b]">{chatAction === "unblock" ? "Unblocking…" : "Unblock person"}</button>}
</div>}
<div ref={messageScroller} className="chat-message-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{messagesLoading&&!messages.length?<p className="text-sm text-[#71878b]">Loading messages...</p>:null}{!messagesLoading&&!messages.length?<div className="grid h-full place-items-center text-center text-[#687f84]"><div><MessageCircle className="mx-auto" size={38} strokeWidth={1.3}/><p className="mt-3 text-sm">Start the conversation</p><p className="mt-1 text-xs">Ask about dates, availability or the trip.</p></div></div>:null}<div className="space-y-3">{messages.map((message,index)=>{const senderId=message?.sender?._id||message?.sender?.id||message?.sender;const mine=String(senderId)===String(uid);return <div key={idOf(message)||`${message.createdAt||"message"}-${index}`} className={`chat-message flex ${mine?"justify-end":"justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${mine?"rounded-br-md bg-[#1d5a46] text-[#effcf5]":"rounded-bl-md bg-[#142534] text-[#d6e1df]"}`}><p>{message.content||message.text||message.message||message.body||""}</p><div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine?"text-[#b4dec8]":"text-[#71888c]"}`}>{message.createdAt?new Date(message.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):""}{mine&&<span className={`inline-flex items-center ${messageStatus(message)==="read" ? "text-[#55a9ff]" : "text-current"}`} title={messageStatus(message)==="read" ? "Read" : messageStatus(message)==="delivered" ? "Delivered" : "Sent"}>{messageStatus(message)==="sent" ? <Check size={12}/> : <span className="relative inline-flex"><Check size={12}/><Check size={12} className="-ml-1.5"/></span>}</span>}</div></div></div>})}</div></div><div className="border-t border-[#233543] bg-[#0a1621] p-3 sm:p-4"><div className="mb-2 flex gap-2 overflow-x-auto pb-1">{suggestions.map((suggestion)=><button key={suggestion} type="button" onClick={()=>setText(suggestion)} className="shrink-0 rounded-full border border-[#263746] px-3 py-1.5 text-[11px] font-semibold text-[#8fa5a7] hover:border-[#477160] hover:text-[#b8e8cf]">{suggestion}</button>)}</div><div className="flex items-end gap-2"><textarea rows="1" className="chat-composer input min-h-[46px] resize-none rounded-xl py-3" disabled={cannotMessage} value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Write a message..."/><button type="button" onClick={send} disabled={!text.trim() || cannotMessage} className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl bg-[#9ee8c0] text-[#06251b] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40" title="Send message"><Send size={17}/></button></div></div></>}</main>
    </div>
    {error&&<div className="mt-3 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-300">{error}</div>}
    <ConfirmDialog
      open={Boolean(confirmAction)}
      title={confirmAction?.type === "block" ? "Block person?" : "Delete conversation?"}
      message={confirmAction?.type === "block"
        ? `${confirmAction?.name || "This person"} will no longer be able to contact you. Messages sent while blocked will fail to deliver.`
        : "This conversation will be removed from your chat list. This action cannot be undone from the app."}
      confirmLabel={confirmAction?.type === "block" ? "Block person" : "Delete conversation"}
      danger
      onCancel={() => setConfirmAction(null)}
      onConfirm={confirmAction?.type === "block" ? confirmBlockPerson : confirmDeleteConversation}
    />
  </section></Layout>;
}
