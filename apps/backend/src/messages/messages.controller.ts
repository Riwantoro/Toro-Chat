import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { MessagesService } from "./messages.service";

class SendMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

class DeleteMessageDto {
  @IsNotEmpty()
  messageId!: string;
}

@Controller("messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(":chatId")
  @UseGuards(AuthGuard)
  list(@Req() req: any, @Param("chatId") chatId: string) {
    return this.messagesService.listMessages(chatId, req.user.sub);
  }

  @Post(":chatId")
  @UseGuards(AuthGuard)
  send(@Req() req: any, @Param("chatId") chatId: string, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(chatId, req.user.sub, dto.text, dto.imageUrl);
  }

  @Post("delete")
  @UseGuards(AuthGuard)
  delete(@Req() req: any, @Body() dto: DeleteMessageDto) {
    const isAdmin = req.user.role === "admin";
    return this.messagesService.deleteMessage(dto.messageId, req.user.sub, isAdmin);
  }
}
