import mongoose from "mongoose";

const integrationSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    provider: { type: String, required: true, trim: true, index: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastStatus: { type: mongoose.Schema.Types.Mixed, default: null },
    lastCheckedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const IntegrationSetting = mongoose.model("IntegrationSetting", integrationSettingSchema);
