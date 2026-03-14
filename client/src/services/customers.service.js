import { api } from "../app/api.js";

export async function listCustomers(params = {}) {
  const { data } = await api.get("/customers", { params });
  return data.items;
}

export async function createCustomer(payload) {
  const { data } = await api.post("/customers", payload);
  return data.item;
}

export async function getCustomer(id) {
  const { data } = await api.get(`/customers/${id}`);
  return data.item;
}

export async function updateCustomer(id, payload) {
  const { data } = await api.patch(`/customers/${id}`, payload);
  return data.item;
}

export async function deleteCustomer(id) {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
}
