import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from "../services/template.service.js";

export async function getTemplates(req, res) {
  const items = await listTemplates(req.query);
  res.json({ ok: true, items });
}

export async function postTemplate(req, res) {
  const item = await createTemplate(req.body);
  res.status(201).json({ ok: true, item });
}

export async function patchTemplate(req, res) {
  const item = await updateTemplate(req.params.id, req.body);
  res.json({ ok: true, item });
}

export async function removeTemplate(req, res) {
  const result = await deleteTemplate(req.params.id);
  res.json({ ok: true, ...result });
}
