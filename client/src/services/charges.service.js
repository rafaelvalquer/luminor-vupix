import { api } from "../app/api.js";

export async function listCharges(params = {}) {
  const { data } = await api.get("/charges", { params });
  return data.items;
}

export async function createCharge(payload) {
  const { data } = await api.post("/charges", payload);
  return data.item;
}

export async function getCharge(id) {
  const { data } = await api.get(`/charges/${id}`);
  return data.item;
}

export async function updateCharge(id, payload) {
  const { data } = await api.patch(`/charges/${id}`, payload);
  return data.item;
}

export async function markChargePaid(id) {
  const { data } = await api.post(`/charges/${id}/mark-paid`);
  return data.item;
}

export async function cancelCharge(id) {
  const { data } = await api.post(`/charges/${id}/cancel`);
  return data.item;
}
