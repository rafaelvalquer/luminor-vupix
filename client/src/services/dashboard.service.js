import { api } from "../app/api.js";

export async function getDashboardSummary() {
  const { data } = await api.get("/dashboard");
  return data.item;
}
