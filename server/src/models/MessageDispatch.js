import mongoose from "mongoose";

const templateSnapshotSchema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "MessageTemplate", default: null },
    name: { type: String, default: "" },
    category: { type: String, default: "custom" },
    content: { type: String, default: "" },
  },
  { _id: false }
);

const messageDispatchSchema = new mongoose.Schema(
  {
    chargeId: { type: mongoose.Schema.Types.ObjectId, ref: "Charge", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    renderedMessage: { type: String, required: true },
    templateUsed: { type: templateSnapshotSchema, default: () => ({}) },
    dispatchType: { type: String, enum: ["manual", "automatic", "retry"], required: true, index: true },
    reminderEventKey: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ["queued", "processing", "sent", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    attemptsCount: { type: Number, default: 0 },
    providerMessageId: { type: String, default: null },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: mongoose.Schema.Types.Mixed, default: null },
    sentAt: { type: Date, default: null },
    idempotencyKey: { type: String, default: null, index: true },
    retryOf: { type: mongoose.Schema.Types.ObjectId, ref: "MessageDispatch", default: null },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

messageDispatchSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const MessageDispatch = mongoose.model("MessageDispatch", messageDispatchSchema);
