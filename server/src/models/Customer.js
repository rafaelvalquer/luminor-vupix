import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Customer = mongoose.model("Customer", customerSchema);
