import { Bell, LogOut, Search, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../app/AuthContext.jsx";
import Button from "../ui/Button.jsx";

const pageTitles = {
  "/": {
    title: "Dashboard operacional",
    subtitle: "Visão geral dos lembretes, status de gateway e atividade recente.",
  },
  "/customers": {
    title: "Clientes",
    subtitle: "Cadastre e mantenha a base de cobrança organizada.",
  },
  "/charges": {
    title: "Cobranças",
    subtitle: "Gerencie vencimentos, status e disparos manuais.",
  },
  "/templates": {
    title: "Templates",
    subtitle: "Mensagens padronizadas com variáveis de cobrança.",
  },
  "/dispatches": {
    title: "Histórico de mensagens",
    subtitle: "Rastreie envios, falhas, retries e resposta técnica do gateway.",
  },
  "/integrations": {
    title: "Integrações WhatsApp",
    subtitle: "Monitore status, QR e disponibilidade do gateway.",
  },
};

export default function Topbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const current =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/charges/")
      ? {
          title: "Detalhe da cobrança",
          subtitle: "Acompanhe a cobrança e todo o histórico de mensagens.",
        }
      : pageTitles["/"]);

  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">
          <Sparkles size={14} />
          Luminor VUPix
        </div>
        <h1 className="page-title">{current.title}</h1>
        <p className="page-subtitle">{current.subtitle}</p>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search">
          <Search size={16} />
          <span>Ambiente operacional</span>
        </div>

        <button type="button" className="icon-button" aria-label="Notificações">
          <Bell size={18} />
        </button>

        <div className="user-pill">
          <div className="user-pill__avatar">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="user-pill__name">{user?.name || "Usuário"}</div>
            <div className="user-pill__email">{user?.email || ""}</div>
          </div>
        </div>

        <Button variant="ghost" icon={LogOut} onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  );
}
