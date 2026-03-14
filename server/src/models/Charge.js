import mongoose from "mongoose";

const chargeSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    description: { type: String, required: true, trim: true },
    amountCents: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "due_today", "overdue", "paid", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true, default: "" },
    autoReminderEnabled: { type: Boolean, default: true, index: true },
    remindersSentCount: { type: Number, default: 0 },
    lastReminderAt: { type: Date, default: null },
    nextReminderAt: { type: Date, default: null, index: true },
    lastDispatchId: { type: mongoose.Schema.Types.ObjectId, ref: "MessageDispatch", default: null },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Charge = mongoose.model("Charge", chargeSchema);
