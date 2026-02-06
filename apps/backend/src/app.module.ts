import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ChatsModule } from "./chats/chats.module";
import { MessagesModule } from "./messages/messages.module";
import { PresenceGateway } from "./presence/presence.gateway";

@Module({
  imports: [AuthModule, UsersModule, ChatsModule, MessagesModule],
  providers: [PresenceGateway]
})
export class AppModule {}
