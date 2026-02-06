import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../auth/jwt.util";
import { store } from "../common/in-memory.store";

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = verifyToken(token);
      store.onlineUserIds.add(payload.sub);
      this.server.emit("presence:update", { userId: payload.sub, online: true });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      return;
    }
    try {
      const payload = verifyToken(token);
      store.onlineUserIds.delete(payload.sub);
      this.server.emit("presence:update", { userId: payload.sub, online: false });
    } catch {
      // ignore
    }
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
