import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, Sparkles, MessageCircleMore, BellRing } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../app/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";

export default function LoginPage() {
  const { login, isAuthenticated, authError } = useAuth();
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
    } catch (_error) {
      setLocalError(authError || "Falha ao autenticar.");
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
        <div className="brand-mark brand-mark--xl">LV</div>
        <div className="eyebrow">Cobrança amigável por WhatsApp</div>
        <h1 className="login-title">
          Transforme lembretes em uma operação elegante, rastreável e pronta para produção.
        </h1>
        <p className="login-description">
          Visual premium, histórico centralizado, retry de falhas e visibilidade total do gateway.
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <ShieldCheck size={18} />
            <span>JWT, histórico e rastreabilidade por dispatch</span>
          </div>
          <div className="feature-item">
            <MessageCircleMore size={18} />
            <span>Envio manual e lembretes automáticos pelo WhatsApp</span>
          </div>
          <div className="feature-item">
            <BellRing size={18} />
            <span>Status online, QR, restart e monitoramento do gateway</span>
          </div>
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
          Entrar no ambiente
        </div>
        <h2 className="login-form-title">Acesse sua operação</h2>
        <p className="login-form-subtitle">
          Use o usuário seedado no backend ou as credenciais do seu ambiente.
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
            placeholder="••••••"
          />

          {localError ? <div className="alert alert--danger">{localError}</div> : null}

          <Button type="submit" loading={loading} className="btn--full">
            Entrar
          </Button>
        </form>

        <div className="login-footnote">
          Credenciais padrão do seed: <strong>admin@luminorvupix.local</strong> / <strong>123456</strong>
        </div>
      </motion.div>
    </div>
  );
}
