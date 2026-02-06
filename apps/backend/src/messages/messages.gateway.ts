import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../auth/jwt.util";
import { MessagesService } from "./messages.service";
import { ChatsService } from "../chats/chats.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: "admin" | "user";
}

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly messagesService: MessagesService, private readonly chatsService: ChatsService) {}

  handleConnection(client: AuthenticatedSocket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = verifyToken(token);
      client.userId = payload.sub;
      client.role = payload.role;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {}

  @SubscribeMessage("chat:join")
  join(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { chatId: string }) {
    if (!client.userId) {
      return;
    }
    this.chatsService.getById(data.chatId, client.userId);
    client.join(data.chatId);
  }

  @SubscribeMessage("message:send")
  send(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; text?: string; imageUrl?: string }
  ) {
    if (!client.userId) {
      return;
    }
    const message = this.messagesService.sendMessage(data.chatId, client.userId, data.text, data.imageUrl);
    this.server.to(data.chatId).emit("message:new", message);
    return message;
  }

  @SubscribeMessage("message:delete")
  delete(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { messageId: string }) {
    if (!client.userId) {
      return;
    }
    const message = this.messagesService.deleteMessage(data.messageId, client.userId, client.role === "admin");
    this.server.to(message.chatId).emit("message:deleted", message);
    return message;
  }

  private extractToken(client: Socket) {
    const tokenFromAuth = client.handshake.auth?.token as string | undefined;
    if (tokenFromAuth) {
      return tokenFromAuth;
    }
    const authHeader = client.handshake.headers["authorization"] as string | undefined;
    if (authHeader) {
      const [, token] = authHeader.split(" ");
      return token;
    }
    return undefined;
  }
}
