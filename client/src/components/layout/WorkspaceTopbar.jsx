import {
  Bell,
  LogOut,
  PanelLeftOpen,
  Sparkles,
  Stars,
  Zap,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../app/AuthContext.jsx";
import { useTheme } from "../../app/ThemeContext.jsx";
import Button from "../ui/Button.jsx";
import ThemeToggleButton from "../ui/ThemeToggleButton.jsx";

const pageTitles = {
  "/": {
    eyebrow: "Hoje tem ritmo, cor e cobranca bem cuidada",
    title: "Painel que organiza e ainda sorri de volta",
    subtitle:
      "Acompanhe lembretes, gateway e sinais da operacao com um visual mais leve e facil de ler.",
  },
  "/customers": {
    eyebrow: "Cadastro com energia boa",
    title: "Clientes queridos no lugar certo",
    subtitle:
      "Mantenha a base organizada, facil de consultar e pronta para um atendimento simpatico.",
  },
  "/charges": {
    eyebrow: "Agenda afinada",
    title: "Cobrancas que nao perdem o compasso",
    subtitle:
      "Visualize vencimentos, proximos lembretes e acoes importantes sem cacar informacao.",
  },
  "/templates": {
    eyebrow: "Copy com personalidade",
    title: "Templates gentis, claros e prontos para agir",
    subtitle:
      "Monte mensagens com tom amigavel e variaveis bem encaixadas para cada momento da cobranca.",
  },
  "/dispatches": {
    eyebrow: "Historico sem drama",
    title: "Mensagens enviadas, falhas e retries num piscar de olhos",
    subtitle:
      "Filtre a operacao, revise respostas do gateway e descubra o que precisa de carinho extra.",
  },
  "/integrations": {
    eyebrow: "Humor tecnico sob controle",
    title: "Central do WhatsApp com visor completo",
    subtitle:
      "Status, QR e reconexao aparecem com clareza para voce agir rapido quando for preciso.",
  },
};

function getCurrentPage(locationPathname) {
  if (pageTitles[locationPathname]) return pageTitles[locationPathname];
  if (locationPathname.startsWith("/charges/")) {
    return {
      eyebrow: "Raio X da cobranca",
      title: "Detalhe completo com contexto e historico",
      subtitle:
        "Veja cliente, status, disparos e proximos passos sem sair do fio da meada.",
    };
  }

  return pageTitles["/"];
}

function buildGreeting(name = "") {
  const hour = new Date().getHours();
  if (hour < 12) return `Bom dia, ${name || "time"}!`;
  if (hour < 18) return `Boa tarde, ${name || "time"}!`;
  return `Boa noite, ${name || "time"}!`;
}

export default function WorkspaceTopbar({ onOpenNav }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const current = getCurrentPage(location.pathname);
  const firstName = (user?.name || "Time").split(" ")[0];

  return (
    <header className="topbar">
      <div className="topbar__lead">
        <div className="topbar__intro">
          <button
            type="button"
            className="icon-button topbar__menu"
            onClick={onOpenNav}
            aria-label="Abrir navegacao"
          >
            <PanelLeftOpen size={18} />
          </button>
          <div>
            <div className="eyebrow">
              <Sparkles size={14} />
              {current.eyebrow}
            </div>
            <h1 className="page-title">{current.title}</h1>
            <p className="page-subtitle">{current.subtitle}</p>
          </div>
        </div>

        <div className="topbar-banner">
          <div className="topbar-banner__icon">
            {isDark ? <Stars size={18} /> : <Zap size={18} />}
          </div>
          <div>
            <strong>{buildGreeting(firstName)}</strong>
            <span>
              {isDark
                ? "Modo escuro divertido ativado para a maratona."
                : "Modo claro vibrante ativado para a rodada do dia."}
            </span>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeToggleButton />

        <div className="topbar-pill">
          <Bell size={15} />
          <span>Ambiente ligado e pronto para brincar serio</span>
        </div>

        <div className="user-pill">
          <div className="user-pill__avatar">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="user-pill__name">{user?.name || "Usuario"}</div>
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
