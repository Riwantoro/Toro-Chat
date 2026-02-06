import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { store } from "../common/in-memory.store";
import { User } from "../common/models";
import { signToken } from "./jwt.util";

@Injectable()
export class AuthService implements OnModuleInit {
  async onModuleInit() {
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@torochat.local";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const existingAdmin = store.users.find((user) => user.email === adminEmail);
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const adminUser: User = {
        id: uuid(),
        email: adminEmail,
        passwordHash,
        displayName: "Admin",
        status: "active",
        role: "admin",
        createdAt: new Date().toISOString()
      };
      store.users.push(adminUser);
    }
  }

  async register(email: string, password: string, displayName: string) {
    const existing = store.users.find((user) => user.email === email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: uuid(),
      email,
      passwordHash,
      displayName,
      status: "pending",
      role: "user",
      createdAt: new Date().toISOString()
    };
    store.users.push(user);
    return { id: user.id, status: user.status };
  }

  async login(email: string, password: string) {
    const user = store.users.find((u) => u.email === email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (user.status !== "active") {
      throw new ForbiddenException("Account pending admin approval");
    }
    const token = signToken({ sub: user.id, role: user.role });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status
      }
    };
  }

  listPending() {
    return store.users
      .filter((user) => user.status === "pending")
      .map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      }));
  }

  approve(userId: string) {
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    user.status = "active";
    return { id: user.id, status: user.status };
  }
}
