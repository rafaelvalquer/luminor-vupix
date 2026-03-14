import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";

export async function ensureDefaultAdmin() {
  const email = env.defaultAdminEmail.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(env.defaultAdminPassword, 10);
  const user = await User.create({
    name: env.defaultAdminName,
    email,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  return user;
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Credenciais inválidas.");
  }

  const isMatch = await bcrypt.compare(String(password || ""), user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, "Credenciais inválidas.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(404, "Usuário não encontrado.");

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}
