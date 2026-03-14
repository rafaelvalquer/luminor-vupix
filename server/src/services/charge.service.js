import { Charge } from "../models/Charge.js";
import { Customer } from "../models/Customer.js";
import { ReminderRule } from "../models/ReminderRule.js";
import { ApiError } from "../utils/apiError.js";
import { computeNextReminderAt, deriveChargeStatus } from "../utils/date.js";

function toChargeDto(charge) {
  const plain = typeof charge.toObject === "function" ? charge.toObject() : charge;
  return {
    ...plain,
    status: deriveChargeStatus(plain),
  };
}

export async function listCharges(query = {}) {
  const filter = {};

  if (query.status) filter.status = String(query.status);
  if (query.customerId) filter.customerId = String(query.customerId);

  if (query.search) {
    const regex = new RegExp(String(query.search).trim(), "i");
    const customers = await Customer.find({ name: regex }).select("_id").lean();
    filter.$or = [
      { description: regex },
      { notes: regex },
      { customerId: { $in: customers.map((item) => item._id) } },
    ];
  }

  const charges = await Charge.find(filter)
    .populate("customerId")
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  return charges.map((charge) => ({ ...charge, status: deriveChargeStatus(charge) }));
}

export async function createCharge(payload) {
  const customer = await Customer.findById(payload.customerId).lean();
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  const rules = await ReminderRule.find({ enabled: true }).lean();
  const nextReminderAt = payload.autoReminderEnabled === false ? null : computeNextReminderAt(payload, rules);

  const charge = await Charge.create({
    customerId: payload.customerId,
    description: String(payload.description || "").trim(),
    amountCents: Number(payload.amountCents || 0),
    dueDate: new Date(payload.dueDate),
    notes: String(payload.notes || "").trim(),
    autoReminderEnabled: payload.autoReminderEnabled !== false,
    nextReminderAt,
    status: deriveChargeStatus(payload),
  });

  return getChargeById(charge._id);
}

export async function getChargeById(id) {
  const charge = await Charge.findById(id).populate("customerId lastDispatchId").lean();
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");
  return { ...charge, status: deriveChargeStatus(charge) };
}

export async function updateCharge(id, payload) {
  const charge = await Charge.findById(id);
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");

  if (payload.customerId !== undefined) {
    const customer = await Customer.findById(payload.customerId).lean();
    if (!customer) throw new ApiError(404, "Cliente não encontrado.");
    charge.customerId = payload.customerId;
  }

  if (payload.description !== undefined) charge.description = String(payload.description || "").trim();
  if (payload.amountCents !== undefined) charge.amountCents = Number(payload.amountCents || 0);
  if (payload.dueDate !== undefined) charge.dueDate = new Date(payload.dueDate);
  if (payload.notes !== undefined) charge.notes = String(payload.notes || "").trim();
  if (payload.autoReminderEnabled !== undefined) charge.autoReminderEnabled = Boolean(payload.autoReminderEnabled);

  const rules = await ReminderRule.find({ enabled: true }).lean();
  charge.status = deriveChargeStatus(charge);
  charge.nextReminderAt = charge.autoReminderEnabled ? computeNextReminderAt(charge, rules) : null;

  await charge.save();
  return getChargeById(charge._id);
}

export async function markChargePaid(id) {
  const charge = await Charge.findById(id);
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");
  charge.status = "paid";
  charge.paidAt = new Date();
  charge.nextReminderAt = null;
  await charge.save();
  return getChargeById(charge._id);
}

export async function cancelCharge(id) {
  const charge = await Charge.findById(id);
  if (!charge) throw new ApiError(404, "Cobrança não encontrada.");
  charge.status = "cancelled";
  charge.cancelledAt = new Date();
  charge.nextReminderAt = null;
  await charge.save();
  return getChargeById(charge._id);
}
