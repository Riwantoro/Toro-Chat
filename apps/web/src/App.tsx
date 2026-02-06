import { useEffect, useMemo, useState } from "react";
import {
  approveUser,
  createDirectChat,
  createGroupChat,
  deleteMessage,
  listChats,
  listMessages,
  listPending,
  listUsers,
  login,
  register
} from "./api";
import { connectSocket, disconnectSocket, getSocket } from "./socket";

interface AuthState {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "admin" | "user";
    status: "pending" | "active";
  };
}

interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  memberIds: string[];
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string | null;
  imageUrl: string | null;
  deletedAt: string | null;
  createdAt: string;
}

interface Contact {
  id: string;
  email: string;
  displayName: string;
  status: string;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const token = auth?.token;

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }
    const socket = connectSocket(token);
    socket.on("presence:update", (payload: { userId: string; online: boolean }) => {
      setOnlineUsers((prev) => ({ ...prev, [payload.userId]: payload.online }));
    });
    socket.on("message:new", (message: Message) => {
      setMessages((prev) => (message.chatId === activeChat?.id ? [...prev, message] : prev));
    });
    socket.on("message:deleted", (message: Message) => {
      setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
    });
    return () => {
      socket.disconnect();
    };
  }, [token, activeChat?.id]);

  useEffect(() => {
    if (!token) {
      return;
    }
    Promise.all([listChats(token), listUsers(token)]).then(([chatList, userList]) => {
      setChats(chatList);
      setContacts(userList);
    });
  }, [token]);

  useEffect(() => {
    if (token && auth?.user.role === "admin") {
      refreshAdmin();
    }
  }, [token, auth?.user.role]);

  useEffect(() => {
    if (!token || !activeChat) {
      return;
    }
    listMessages(token, activeChat.id).then(setMessages);
    getSocket()?.emit("chat:join", { chatId: activeChat.id });
  }, [token, activeChat]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.target as HTMLFormElement);
    try {
      const data = await login(String(form.get("email")), String(form.get("password")));
      setAuth(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.target as HTMLFormElement);
    try {
      await register(String(form.get("email")), String(form.get("password")), String(form.get("displayName")));
      setTab("login");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function refreshAdmin() {
    if (!token) return;
    try {
      const data = await listPending(token);
      setPendingUsers(data as Contact[]);
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleApprove(userId: string) {
    if (!token) return;
    try {
      await approveUser(token, userId);
      refreshAdmin();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleCreateDirect(otherUserId: string) {
    if (!token) return;
    const chat = (await createDirectChat(token, otherUserId)) as Chat;
    setChats((prev) => {
      const exists = prev.some((item) => item.id === chat.id);
      return exists ? prev : [...prev, chat];
    });
    setActiveChat(chat);
  }

  async function handleCreateGroup() {
    if (!token) return;
    if (!groupName.trim() || groupMembers.length < 2) {
      setActionError("Minimal 2 anggota dan nama grup wajib diisi.");
      return;
    }
    try {
      const chat = (await createGroupChat(token, groupName, groupMembers)) as Chat;
      setChats((prev) => [...prev, chat]);
      setGroupName("");
      setGroupMembers([]);
      setActiveChat(chat);
      setActionError(null);
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleSendMessage() {
    if (!token || !activeChat || !messageText.trim()) {
      return;
    }
    getSocket()?.emit("message:send", { chatId: activeChat.id, text: messageText });
    setMessageText("");
  }

  async function handleDeleteMessage(messageId: string) {
    if (!token) return;
    try {
      await deleteMessage(token, messageId);
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  const currentUserId = auth?.user.id;
  const canAdmin = auth?.user.role === "admin";

  const activeChatName = useMemo(() => {
    if (!activeChat) return "Pilih chat";
    if (activeChat.isGroup) return activeChat.name ?? "Group";
    const otherId = activeChat.memberIds.find((id) => id !== currentUserId);
    const other = contacts.find((c) => c.id === otherId);
    return other?.displayName ?? "Direct Chat";
  }, [activeChat, contacts, currentUserId]);

  if (!auth) {
    return (
      <div className="app">
        <aside className="sidebar">
          <h1>Toro Chat</h1>
          <p>Realtime chat demo dengan approval admin.</p>
        </aside>
        <main className="content">
          <div className="panel stack">
            <div>
              <button className="button secondary" onClick={() => setTab("login")}>
                Login
              </button>
              <button className="button secondary" onClick={() => setTab("register")}>
                Register
              </button>
            </div>
            {tab === "login" ? (
              <form className="stack" onSubmit={handleLogin}>
                <input className="input" name="email" placeholder="Email" required />
                <input className="input" name="password" placeholder="Password" type="password" required />
                <button className="button" type="submit">
                  Login
                </button>
              </form>
            ) : (
              <form className="stack" onSubmit={handleRegister}>
                <input className="input" name="displayName" placeholder="Nama" required />
                <input className="input" name="email" placeholder="Email" required />
                <input className="input" name="password" placeholder="Password" type="password" required />
                <button className="button" type="submit">
                  Register
                </button>
              </form>
            )}
            {error && <div>{error}</div>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Toro Chat</h1>
        <div className="panel">
          <div className="section-title">Profil</div>
          <div style={{ fontWeight: 700 }}>{auth.user.displayName}</div>
          <div style={{ color: "#cbd5e1", fontSize: 12 }}>{auth.user.email}</div>
          <div className="pill">Role: {auth.user.role}</div>
        </div>

        <div className="panel stack">
          <div className="section-title">Kontak</div>
          <div className="list">
            {contacts.map((contact) => (
              <div key={contact.id} className="item">
                <div>
                  <div>{contact.displayName}</div>
                  <small>{contact.email}</small>
                </div>
                <div className={`presence ${onlineUsers[contact.id] ? "online" : ""}`} />
                <button className="button" onClick={() => handleCreateDirect(contact.id)}>
                  Chat
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel stack">
          <div className="section-title">Buat Group</div>
          <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nama group" />
          <select
            className="select"
            multiple
            value={groupMembers}
            onChange={(e) => setGroupMembers(Array.from(e.target.selectedOptions).map((opt) => opt.value))}
          >
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.displayName}
              </option>
            ))}
          </select>
          <button className="button" onClick={handleCreateGroup}>
            Buat Group
          </button>
        </div>

        {canAdmin && (
          <div className="panel stack">
            <div className="section-title">Approval Admin</div>
            <button className="button secondary" onClick={refreshAdmin}>
              Refresh Pending
            </button>
            <div className="list">
              {pendingUsers.map((user) => (
                <div key={user.id} className="item">
                  <div>
                    <div>{user.displayName}</div>
                    <small>{user.email}</small>
                  </div>
                  <button className="button ghost" onClick={() => handleApprove(user.id)}>
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="content">
        <div className="header-hero">
          <div>
            <div className="section-title" style={{ margin: 0 }}>
              {activeChat ? "Obrolan aktif" : "Selamat datang"}
            </div>
            <div style={{ color: "#475569", fontSize: 13 }}>
              {activeChat ? activeChatName : "Pilih kontak atau buat grup untuk mulai ngobrol"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {actionError && <div style={{ color: "#ef4444", fontSize: 12 }}>{actionError}</div>}
            <div className="pill">Realtime on</div>
          </div>
        </div>
        <div className="chat-area">
          <div className="panel">
            <h2>{activeChatName}</h2>
          </div>
          <div className="panel message-list">
            {messages.length === 0 ? (
              <div style={{ color: "#94a3b8", textAlign: "center", marginTop: 20 }}>Belum ada pesan</div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.senderId === currentUserId ? "me" : ""} ${
                    message.deletedAt ? "deleted" : ""
                  }`}
                >
                  {message.deletedAt ? "Pesan dihapus" : message.text}
                  {message.senderId === currentUserId && !message.deletedAt && (
                    <button className="button secondary" onClick={() => handleDeleteMessage(message.id)}>
                      Hapus
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="panel stack">
            <input
              className="input"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Ketik pesan"
            />
            <button className="button" disabled={!activeChat || !messageText.trim()} onClick={handleSendMessage}>
              Kirim
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
