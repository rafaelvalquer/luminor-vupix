import { useState } from "react";
import { Navigate } from "react-router-dom";
import { BellRing, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../app/AuthContext.jsx";
import { extractApiError } from "../app/api.js";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import ThemeToggleButton from "../components/ui/ThemeToggleButton.jsx";

const features = [
  {
    icon: ShieldCheck,
    title: "Tudo clarinho no backstage",
    description: "Login, historico e rastreio organizados para voce trabalhar com calma.",
  },
  {
    icon: MessageCircleMore,
    title: "WhatsApp com mais simpatia",
    description: "Templates, disparos e retries com linguagem mais leve e visual acolhedor.",
  },
  {
    icon: BellRing,
    title: "Gateway sob observacao boa",
    description: "QR, status e restart aparecem de forma tecnica, mas sem cara de sala fria.",
  },
];

export default function LoginPlayfulPage() {
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    email: "admin@luminorvupix.local",
    password: "123456",
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setLocalError("");
      await login(form);
    } catch (error) {
      setLocalError(extractApiError(error, "Nao foi possivel entrar agora."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <motion.div
        className="login-panel login-panel--brand"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="login-panel__top">
          <div className="brand-mark brand-mark--xl">LV</div>
          <ThemeToggleButton compact />
        </div>

        <div className="eyebrow">
          <Sparkles size={14} />
          Um painel de cobranca que trocou a gravata por carisma
        </div>

        <h1 className="login-title">
          Organize cobrancas, acompanhe o gateway e mande mensagens sem perder o bom humor.
        </h1>

        <p className="login-description">
          O novo Luminor VUPix mistura clareza, cor e simpatia para deixar a rotina mais leve,
          sem esconder o que importa.
        </p>

        <div className="login-mood-card">
          <strong>{"\u{1F31E}"} modo claro vibrante + {"\u{1F319}"} modo escuro divertido</strong>
          <span>Voce escolhe o clima. A operacao continua afiada nos dois.</span>
        </div>

        <div className="feature-list">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="feature-item">
                <Icon size={18} />
                <div>
                  <strong>{feature.title}</strong>
                  <div className="table-muted">{feature.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        className="login-panel login-panel--form"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="eyebrow">
          <Sparkles size={14} />
          Bora abrir a operacao
        </div>
        <h2 className="login-form-title">Entre e deixe a rotina mais charmosa</h2>
        <p className="login-form-subtitle">
          Use a conta seedada no ambiente ou as credenciais oficiais do seu time.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="admin@luminorvupix.local"
          />

          <Input
            label="Senha"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Digite sua senha"
          />

          {localError ? <div className="alert alert--danger">{localError}</div> : null}

          <Button type="submit" loading={loading} className="btn--full">
            Entrar no painel bonito
          </Button>
        </form>

        <div className="login-footnote">
          Credenciais seed: <strong>admin@luminorvupix.local</strong> / <strong>123456</strong>
        </div>
      </motion.div>
    </div>
  );
}
