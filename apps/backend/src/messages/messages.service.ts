import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { store } from "../common/in-memory.store";
import { Message } from "../common/models";
import { ChatsService } from "../chats/chats.service";

@Injectable()
export class MessagesService {
  constructor(private readonly chatsService: ChatsService) {}

  listMessages(chatId: string, userId: string) {
    this.chatsService.getById(chatId, userId);
    return store.messages.filter((message) => message.chatId === chatId);
  }

  sendMessage(chatId: string, userId: string, text?: string, imageUrl?: string) {
    const chat = this.chatsService.getById(chatId, userId);
    if (!text && !imageUrl) {
      throw new ForbiddenException("Message must have text or image");
    }
    const message: Message = {
      id: uuid(),
      chatId: chat.id,
      senderId: userId,
      text: text ?? null,
      imageUrl: imageUrl ?? null,
      deletedAt: null,
      createdAt: new Date().toISOString()
    };
    store.messages.push(message);
    return message;
  }

  deleteMessage(messageId: string, userId: string, isAdmin: boolean) {
    const message = store.messages.find((m) => m.id === messageId);
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    this.chatsService.getById(message.chatId, userId);
    if (message.senderId !== userId && !isAdmin) {
      throw new ForbiddenException("Cannot delete this message");
    }
    message.deletedAt = new Date().toISOString();
    message.text = null;
    message.imageUrl = null;
    return message;
  }
}
