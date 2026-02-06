import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { IsArray, IsNotEmpty, IsString } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { ChatsService } from "./chats.service";

class DirectChatDto {
  @IsString()
  @IsNotEmpty()
  otherUserId!: string;
}

class GroupChatDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  memberIds!: string[];
}

@Controller("chats")
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  @UseGuards(AuthGuard)
  list(@Req() req: any) {
    return this.chatsService.listForUser(req.user.sub);
  }

  @Post("direct")
  @UseGuards(AuthGuard)
  createDirect(@Req() req: any, @Body() dto: DirectChatDto) {
    return this.chatsService.createDirect(req.user.sub, dto.otherUserId);
  }

  @Post("group")
  @UseGuards(AuthGuard)
  createGroup(@Req() req: any, @Body() dto: GroupChatDto) {
    return this.chatsService.createGroup(req.user.sub, dto.name, dto.memberIds ?? []);
  }
}
