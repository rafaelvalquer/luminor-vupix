import { api } from "../app/api.js";

export async function listTemplates(params = {}) {
  const { data } = await api.get("/templates", { params });
  return data.items;
}

export async function createTemplate(payload) {
  const { data } = await api.post("/templates", payload);
  return data.item;
}

export async function updateTemplate(id, payload) {
  const { data } = await api.patch(`/templates/${id}`, payload);
  return data.item;
}

export async function deleteTemplate(id) {
  const { data } = await api.delete(`/templates/${id}`);
  return data;
}

export async function listGentleProfiles() {
  const { data } = await api.get("/templates/gentle-profiles");
  return data.items;
}

export async function createGentleProfile(payload) {
  const { data } = await api.post("/templates/gentle-profiles", payload);
  return data.item;
}
