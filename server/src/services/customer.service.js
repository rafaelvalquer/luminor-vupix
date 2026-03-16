import { Customer } from "../models/Customer.js";
import { Charge } from "../models/Charge.js";
import { ApiError } from "../utils/apiError.js";
import { normalizePhone } from "../utils/phone.js";

export async function listCustomers(query) {
  const search = String(query.search || "").trim();
  const isActive = query.isActive;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  if (isActive !== undefined && isActive !== "") {
    filter.isActive = String(isActive) === "true";
  }

  return Customer.find(filter).sort({ createdAt: -1 }).lean();
}

export async function createCustomer(payload) {
  const customer = await Customer.create({
    name: String(payload.name || "").trim(),
    phone: normalizePhone(payload.phone),
    email: String(payload.email || "").trim(),
    notes: String(payload.notes || "").trim(),
    tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    isActive: payload.isActive !== false,
  });

  return customer.toObject();
}

export async function getCustomerById(id) {
  const customer = await Customer.findById(id).lean();
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");
  return customer;
}

export async function updateCustomer(id, payload) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");

  if (payload.name !== undefined) customer.name = String(payload.name).trim();
  if (payload.phone !== undefined) customer.phone = normalizePhone(payload.phone);
  if (payload.email !== undefined) customer.email = String(payload.email || "").trim();
  if (payload.notes !== undefined) customer.notes = String(payload.notes || "").trim();
  if (payload.tags !== undefined) {
    customer.tags = Array.isArray(payload.tags)
      ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [];
  }
  if (payload.isActive !== undefined) customer.isActive = Boolean(payload.isActive);

  await customer.save();
  return customer.toObject();
}

export async function deleteCustomer(id) {
  const customer = await Customer.findById(id);
  const linkedChargesCount = customer
    ? await Charge.countDocuments({ customerId: customer._id })
    : 0;
  if (linkedChargesCount > 0) {
    throw new ApiError(
      409,
      `Cliente possui ${linkedChargesCount} cobranca(s) vinculada(s) e nao pode ser excluido.`
    );
  }
  if (!customer) throw new ApiError(404, "Cliente não encontrado.");
  await customer.deleteOne();
  return { success: true };
}
