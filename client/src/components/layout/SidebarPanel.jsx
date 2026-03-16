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
  {
    to: "/charges",
    label: "Cobrancas em dia",
    caption: "Agenda, status e acao",
    icon: Receipt,
  },
  {
    to: "/templates",
    label: "Templates gentis",
    caption: "Textos com personalidade",
    icon: FileText,
  },
  {
    to: "/dispatches",
    label: "Historico esperto",
    caption: "Envios, retries e detalhes",
    icon: MessagesSquare,
  },
  {
    to: "/integrations",
    label: "Central do zap",
    caption: "Gateway, QR e humor tecnico",
    icon: PlugZap,
  },
];

export default function SidebarPanel({ open = false, onClose }) {
  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`.trim()}>
      <div className="sidebar__mobile-head">
        <span>menu fofinho</span>
        <button type="button" className="icon-button" onClick={onClose}>
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="brand-card">
        <div className="brand-mark">LV</div>
        <div>
          <div className="brand-title">Luminor VUPix</div>
          <div className="brand-subtitle">Cobranca amigavel com brilho proprio</div>
        </div>
      </div>

      <div className="sidebar-sticker">
        <strong>{"\u{1F389}"} time do bom humor</strong>
        <p>Um painel divertido na medida certa, sem perder a clareza da operacao.</p>
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
              <span className="sidebar-link__copy">
                <strong>{item.label}</strong>
                <small>{item.caption}</small>
              </span>
              <ChevronRight size={15} className="sidebar-link__arrow" />
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer__label">mote do dia</div>
        <div className="sidebar-footer__text">
          Cobranca boa e cobranca clara. O resto a gente resolve com cor, contexto e calma.
        </div>
      </div>
    </aside>
  );
}
