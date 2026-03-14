import { ApiError } from "./apiError.js";

export function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new ApiError(400, "Telefone inválido.");
  }
  return digits;
}
