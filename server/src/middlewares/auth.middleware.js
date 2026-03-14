import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";

export async function requireAuth(req, _res, next) {
  const header = String(req.headers.authorization || "").trim();
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return next(new ApiError(401, "Token ausente."));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user || !user.isActive) {
      throw new Error("invalid_user");
    }

    req.auth = {
      userId: user._id,
      role: user.role,
      email: user.email,
    };

    return next();
  } catch (_error) {
    return next(new ApiError(401, "Token inválido."));
  }
}
