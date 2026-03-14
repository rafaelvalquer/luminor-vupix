import { loginUser, getMe } from "../services/auth.service.js";

export async function login(req, res) {
  const result = await loginUser(req.body);
  res.json({ ok: true, ...result });
}

export async function me(req, res) {
  const user = await getMe(req.auth.userId);
  res.json({ ok: true, user });
}
