import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessagesSquare,
  Users,
} from "lucide-react";
import StatCard from "../ui/StatCard.jsx";

export default function KPIGrid({ kpis }) {
  const items = [
    {
      key: "pending",
      title: "Pendentes",
      value: kpis?.pendingCharges ?? 0,
      icon: Clock3,
      description: "Cobranças ativas",
      tone: "warning",
    },
    {
      key: "overdue",
      title: "Vencidas",
      value: kpis?.overdueCharges ?? 0,
      icon: AlertTriangle,
      description: "Precisam de ação",
      tone: "danger",
    },
    {
      key: "paid",
      title: "Pagas",
      value: kpis?.paidCharges ?? 0,
      icon: CheckCircle2,
      description: "Quitadas no sistema",
      tone: "success",
    },
    {
      key: "sent",
      title: "Mensagens hoje",
      value: kpis?.messagesSentToday ?? 0,
      icon: MessagesSquare,
      description: "Disparos concluídos",
      tone: "success",
    },
    {
      key: "failed",
      title: "Falhas hoje",
      value: kpis?.messagesFailedToday ?? 0,
      icon: AlertTriangle,
      description: "Exigem revisão",
      tone: "danger",
    },
    {
      key: "customers",
      title: "Clientes",
      value: kpis?.customersCount ?? 0,
      icon: Users,
      description: kpis?.gatewayOnline ? "Gateway online" : "Gateway offline",
      tone: kpis?.gatewayOnline ? "success" : "danger",
    },
  ];

  return (
    <div className="stats-grid">
      {items.map((item) => (
        <StatCard key={item.key} {...item} />
      ))}
    </div>
  );
}
