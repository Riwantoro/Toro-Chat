import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { store } from "../common/in-memory.store";

@Controller("users")
export class UsersController {
  @Get()
  @UseGuards(AuthGuard)
  list(@Req() req: any) {
    const userId = req.user?.sub as string;
    return store.users
      .filter((user) => user.status === "active" && user.id !== userId)
      .map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status
      }));
  }
}
