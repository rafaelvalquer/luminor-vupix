import mongoose from "mongoose";

const reminderRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      enum: ["before_due", "due_today", "after_due"],
      required: true,
      index: true,
    },
    daysOffset: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true, index: true },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "MessageTemplate", default: null },
  },
  { timestamps: true }
);

export const ReminderRule = mongoose.model("ReminderRule", reminderRuleSchema);
