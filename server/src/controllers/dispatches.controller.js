import {
  getDispatchById,
  listDispatches,
  retryDispatch,
  sendManualDispatch,
} from "../services/dispatch.service.js";

export async function getDispatches(req, res) {
  const items = await listDispatches(req.query);
  res.json({ ok: true, items });
}

export async function getDispatch(req, res) {
  const item = await getDispatchById(req.params.id);
  res.json({ ok: true, item });
}

export async function postSendManualDispatch(req, res) {
  const item = await sendManualDispatch(req.body, req.auth);
  res.status(201).json({ ok: true, item });
}

export async function postRetryDispatch(req, res) {
  const item = await retryDispatch(req.params.id, req.auth);
  res.status(201).json({ ok: true, item });
}
