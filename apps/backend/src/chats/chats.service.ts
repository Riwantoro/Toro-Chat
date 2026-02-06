import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { store } from "../common/in-memory.store";
import { Chat } from "../common/models";

@Injectable()
export class ChatsService {
  listForUser(userId: string) {
    return store.chats.filter((chat) => chat.memberIds.includes(userId));
  }

  getById(chatId: string, userId: string) {
    const chat = store.chats.find((c) => c.id === chatId);
    if (!chat) {
      throw new NotFoundException("Chat not found");
    }
    if (!chat.memberIds.includes(userId)) {
      throw new ForbiddenException("Not a member of this chat");
    }
    return chat;
  }

  createDirect(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException("Cannot chat with yourself");
    }
    const existing = store.chats.find(
      (chat) =>
        !chat.isGroup &&
        chat.memberIds.length === 2 &&
        chat.memberIds.includes(userId) &&
        chat.memberIds.includes(otherUserId)
    );
    if (existing) {
      return existing;
    }
    const chat: Chat = {
      id: uuid(),
      name: null,
      isGroup: false,
      memberIds: [userId, otherUserId],
      createdAt: new Date().toISOString()
    };
    store.chats.push(chat);
    return chat;
  }

  createGroup(userId: string, name: string, memberIds: string[]) {
    const uniqueMembers = Array.from(new Set([userId, ...memberIds]));
    if (uniqueMembers.length < 3) {
      throw new BadRequestException("Group must have at least 3 members");
    }
    const chat: Chat = {
      id: uuid(),
      name,
      isGroup: true,
      memberIds: uniqueMembers,
      createdAt: new Date().toISOString()
    };
    store.chats.push(chat);
    return chat;
  }
}
