import mongoose from "mongoose";

const messageTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      default: "manual",
      enum: ["manual", "before_due", "due_today", "after_due", "custom"],
      index: true,
    },
    content: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    isSystemDefault: { type: Boolean, default: false, index: true },
    profileKey: { type: String, default: null, index: true },
    eventTypeWithinProfile: {
      type: String,
      enum: ["before_due", "due_today", "after_due", "manual", null],
      default: null,
    },
  },
  { timestamps: true }
);

export const MessageTemplate = mongoose.model("MessageTemplate", messageTemplateSchema);
