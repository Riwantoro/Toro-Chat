export type UserStatus = "pending" | "active";
export type Role = "admin" | "user";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  status: UserStatus;
  role: Role;
  createdAt: string;
}

export interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  memberIds: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string | null;
  imageUrl: string | null;
  deletedAt: string | null;
  createdAt: string;
}
