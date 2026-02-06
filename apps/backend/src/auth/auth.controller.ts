import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { AuthGuard } from "./auth.guard";
import { AdminGuard } from "./admin.guard";
import { AuthService } from "./auth.service";

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  displayName!: string;

  @MinLength(6)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}

class ApproveDto {
  @IsNotEmpty()
  userId!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.displayName);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get("admin/pending")
  @UseGuards(AuthGuard, AdminGuard)
  listPending() {
    return this.authService.listPending();
  }

  @Post("admin/approve")
  @UseGuards(AuthGuard, AdminGuard)
  approve(@Body() dto: ApproveDto) {
    return this.authService.approve(dto.userId);
  }
}
