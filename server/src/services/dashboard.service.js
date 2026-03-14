import { Charge } from "../models/Charge.js";
import { MessageDispatch } from "../models/MessageDispatch.js";
import { Customer } from "../models/Customer.js";
import { deriveChargeStatus, endOfDay, startOfDay } from "../utils/date.js";
import { getWhatsAppIntegrationStatus } from "./integration.service.js";

export async function getDashboardSummary() {
  const charges = await Charge.find().populate("customerId").lean();
  const dispatchesToday = await MessageDispatch.find({
    createdAt: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) },
  })
    .populate("customerId chargeId")
    .sort({ createdAt: -1 })
    .lean();

  const recentDispatches = await MessageDispatch.find()
    .populate("customerId chargeId")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const upcomingReminders = charges
    .filter((charge) => charge.nextReminderAt)
    .sort((a, b) => new Date(a.nextReminderAt) - new Date(b.nextReminderAt))
    .slice(0, 8);

  let pendingCount = 0;
  let overdueCount = 0;
  let paidCount = 0;

  for (const charge of charges) {
    const status = deriveChargeStatus(charge);
    if (status === "pending" || status === "due_today") pendingCount += 1;
    if (status === "overdue") overdueCount += 1;
    if (status === "paid") paidCount += 1;
  }

  const customersCount = await Customer.countDocuments();
  const failedToday = dispatchesToday.filter((item) => item.status === "failed").length;
  const sentToday = dispatchesToday.filter((item) => item.status === "sent").length;
  const integration = await getWhatsAppIntegrationStatus();

  return {
    kpis: {
      pendingCharges: pendingCount,
      overdueCharges: overdueCount,
      paidCharges: paidCount,
      messagesSentToday: sentToday,
      messagesFailedToday: failedToday,
      customersCount,
      gatewayOnline: Boolean(integration?.status?.ready),
    },
    upcomingReminders,
    recentDispatches,
    gateway: integration,
  };
}
