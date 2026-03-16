import {
  ChevronRight,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  PanelLeftClose,
  PlugZap,
  Receipt,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  {
    to: "/",
    label: "Painel sorridente",
    caption: "Resumo e clima da operacao",
    icon: LayoutDashboard,
  },
  {
    to: "/customers",
    label: "Clientes queridos",
    caption: "Cadastro com carinho",
    icon: Users,
  },
  { to: "/charges", label: "Cobranças", icon: Receipt },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/dispatches", label: "Histórico", icon: MessagesSquare },
  { to: "/integrations", label: "Integrações", icon: PlugZap },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-card">
        <div className="brand-mark">LV</div>
        <div>
          <div className="brand-title">Luminor VUPix</div>
          <div className="brand-subtitle">Cobrança amigável</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
              }
            >
              <span className="sidebar-link__icon">
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
              <ChevronRight size={15} className="sidebar-link__arrow" />
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer__label">Operação</div>
        <div className="sidebar-footer__text">
          Disparos, lembretes e monitoramento em um único painel.
        </div>
      </div>
    </aside>
  );
}
