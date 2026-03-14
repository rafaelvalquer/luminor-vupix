import { api } from "../app/api.js";

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data;
}
