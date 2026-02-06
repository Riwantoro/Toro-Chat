const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "admin" | "user";
    status: "pending" | "active";
  };
}

async function request<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function register(email: string, password: string, displayName: string) {
  return request<{ id: string; status: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName })
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function listPending(token: string) {
  return request<Array<{ id: string; email: string; displayName: string; createdAt: string }>>("/auth/admin/pending", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function approveUser(token: string, userId: string) {
  return request<{ id: string; status: string }>("/auth/admin/approve", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId })
  });
}

export function listUsers(token: string) {
  return request<Array<{ id: string; email: string; displayName: string; status: string }>>("/users", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function listChats(token: string) {
  return request<Array<{ id: string; name: string | null; isGroup: boolean; memberIds: string[] }>>("/chats", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createDirectChat(token: string, otherUserId: string) {
  return request("/chats/direct", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ otherUserId })
  });
}

export function createGroupChat(token: string, name: string, memberIds: string[]) {
  return request("/chats/group", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, memberIds })
  });
}

export function listMessages(token: string, chatId: string) {
  return request<Array<{ id: string; chatId: string; senderId: string; text: string | null; imageUrl: string | null; deletedAt: string | null; createdAt: string }>>(
    `/messages/${chatId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

export function deleteMessage(token: string, messageId: string) {
  return request(`/messages/delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messageId })
  });
}
