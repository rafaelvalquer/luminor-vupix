import {
  createReminderRule,
  listReminderRules,
  runReminderJobNow,
  updateReminderRule,
} from "../services/reminder.service.js";

export async function runNow(req, res) {
  const result = await runReminderJobNow(req.auth);
  res.json({ ok: true, result });
}

export async function getReminderRules(req, res) {
  const items = await listReminderRules();
  res.json({ ok: true, items });
}

export async function postReminderRule(req, res) {
  const item = await createReminderRule(req.body);
  res.status(201).json({ ok: true, item });
}

export async function patchReminderRule(req, res) {
  const item = await updateReminderRule(req.params.id, req.body);
  res.json({ ok: true, item });
}
