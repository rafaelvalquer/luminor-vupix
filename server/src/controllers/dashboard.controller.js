import { getDashboardSummary } from "../services/dashboard.service.js";

export async function getDashboard(req, res) {
  const item = await getDashboardSummary();
  res.json({ ok: true, item });
}
