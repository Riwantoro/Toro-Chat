import { Chat, Message, User } from "./models";

export class InMemoryStore {
  users: User[] = [];
  chats: Chat[] = [];
  messages: Message[] = [];
  onlineUserIds = new Set<string>();

  reset() {
    this.users = [];
    this.chats = [];
    this.messages = [];
    this.onlineUserIds = new Set<string>();
  }
}

export const store = new InMemoryStore();
