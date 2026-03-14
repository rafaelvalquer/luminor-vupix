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
  },
  { timestamps: true }
);

export const MessageTemplate = mongoose.model("MessageTemplate", messageTemplateSchema);
