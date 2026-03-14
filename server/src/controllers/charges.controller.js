import {
  cancelCharge,
  createCharge,
  getChargeById,
  listCharges,
  markChargePaid,
  updateCharge,
} from "../services/charge.service.js";

export async function getCharges(req, res) {
  const items = await listCharges(req.query);
  res.json({ ok: true, items });
}

export async function postCharge(req, res) {
  const item = await createCharge(req.body);
  res.status(201).json({ ok: true, item });
}

export async function getCharge(req, res) {
  const item = await getChargeById(req.params.id);
  res.json({ ok: true, item });
}

export async function patchCharge(req, res) {
  const item = await updateCharge(req.params.id, req.body);
  res.json({ ok: true, item });
}

export async function postMarkPaid(req, res) {
  const item = await markChargePaid(req.params.id);
  res.json({ ok: true, item });
}

export async function postCancelCharge(req, res) {
  const item = await cancelCharge(req.params.id);
  res.json({ ok: true, item });
}
