import { api } from "../app/api.js";

export async function listDispatches(params = {}) {
  const { data } = await api.get("/dispatches", { params });
  return data.items;
}

export async function sendManualDispatch(payload) {
  const { data } = await api.post("/dispatches/send-manual", payload);
  return data.item;
}

export async function retryDispatch(id) {
  const { data } = await api.post(`/dispatches/${id}/retry`);
  return data.item;
}
