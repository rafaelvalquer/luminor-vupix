import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from "../services/customer.service.js";

export async function getCustomers(req, res) {
  const items = await listCustomers(req.query);
  res.json({ ok: true, items });
}

export async function postCustomer(req, res) {
  const item = await createCustomer(req.body);
  res.status(201).json({ ok: true, item });
}

export async function getCustomer(req, res) {
  const item = await getCustomerById(req.params.id);
  res.json({ ok: true, item });
}

export async function patchCustomer(req, res) {
  const item = await updateCustomer(req.params.id, req.body);
  res.json({ ok: true, item });
}

export async function removeCustomer(req, res) {
  const result = await deleteCustomer(req.params.id);
  res.json({ ok: true, ...result });
}
