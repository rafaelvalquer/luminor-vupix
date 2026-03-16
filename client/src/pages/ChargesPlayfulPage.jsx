import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Pencil, Plus, Search, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, Textarea } from "../components/ui/Input.jsx";
import Modal from "../components/ui/Modal.jsx";
import Select from "../components/ui/Select.jsx";
import Badge from "../components/ui/Badge.jsx";
import Table from "../components/ui/Table.jsx";
import PageHero from "../components/ui/PageHero.jsx";
import FriendlyEmptyState from "../components/ui/FriendlyEmptyState.jsx";
import FriendlyManualDispatchModal from "../components/dispatch/FriendlyManualDispatchModal.jsx";
import { extractApiError } from "../app/api.js";
import {
  createCharge,
  listCharges,
  markChargePaid,
  updateCharge,
} from "../services/charges.service.js";
import { listCustomers } from "../services/customers.service.js";
import { listTemplates } from "../services/templates.service.js";
import { formatBRLFromCents, parseMoneyToCents } from "../utils/currency.js";
import { formatDate, toDateInputValue } from "../utils/date.js";
import { getChargeStatusMeta } from "../utils/status.js";

const initialForm = {
  customerId: "",
  description: "",
  amount: "",
  dueDate: "",
  notes: "",
  autoReminderEnabled: true,
  messageProfile: "profissional",
};

export default function ChargesPlayfulPage() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dispatchCharge, setDispatchCharge] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [chargeItems, customerItems, templateItems] = await Promise.all([
        listCharges({ search, status }),
        listCustomers(),
        listTemplates(),
      ]);
      setItems(chargeItems);
      setCustomers(customerItems);
      setTemplates(templateItems);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Nao foi possivel carregar as cobrancas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "charge", label: "Cobranca" },
      { key: "amount", label: "Valor" },
      { key: "dueDate", label: "Vencimento" },
      { key: "status", label: "Status" },
      { key: "nextReminderAt", label: "Proximo lembrete" },
      { key: "actions", label: "Acoes" },
    ],
    []
  );

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      customerId: item.customerId?._id || item.customerId || "",
      description: item.description || "",
      amount: ((item.amountCents || 0) / 100).toFixed(2).replace(".", ","),
      dueDate: toDateInputValue(item.dueDate),
      notes: item.notes || "",
      autoReminderEnabled: item.autoReminderEnabled !== false,
      messageProfile: item.messageProfile || "profissional",
    });
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        customerId: form.customerId,
        description: form.description,
        amountCents: parseMoneyToCents(form.amount),
        dueDate: form.dueDate,
        notes: form.notes,
        autoReminderEnabled: form.autoReminderEnabled,
        messageProfile: form.messageProfile || "profissional",
      };

      if (editing?._id) {
        await updateCharge(editing._id, payload);
      } else {
        await createCharge(payload);
      }

      setOpen(false);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Nao foi possivel salvar a cobranca."));
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(item) {
    const confirmed = window.confirm(`Marcar a cobranca "${item.description}" como paga?`);
    if (!confirmed) return;

    try {
      await markChargePaid(item._id);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Nao foi possivel marcar como paga."));
    }
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="agenda bonita"
        emoji={"\u{1F4B8}"}
        title="Cobrancas organizadas ficam mais faceis de acompanhar e muito mais simpaticas de operar."
        description="Crie vencimentos, acompanhe proximos lembretes e dispare mensagens sem sair do compasso da rotina."
        badge={`${items.length} cobranca(s) na mesa`}
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Nova cobranca
          </Button>
        }
        aside={
          <div className="hero-aside-card">
            <strong>{"\u{1F4CC}"} foco do dia</strong>
            <p>Quando o cadastro esta redondinho, a cobranca deixa de ser correria e vira fluxo.</p>
            <div className="hero-aside-card__row">
              <span>vencidas</span>
              <strong>{items.filter((item) => item.status === "overdue").length}</strong>
            </div>
            <div className="hero-aside-card__row">
              <span>pagas</span>
              <strong>{items.filter((item) => item.status === "paid").length}</strong>
            </div>
          </div>
        }
      />

      <Card>
        <CardHeader
          title="Lista de cobrancas"
          subtitle="Tudo o que vence, o que foi pago e o que ainda pede acao aparece aqui."
        />
        <CardBody>
          <div className="filters-row">
            <Input
              label="Busca"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cliente, descricao ou observacao"
            />
            <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="due_today">Vence hoje</option>
              <option value="overdue">Vencida</option>
              <option value="paid">Paga</option>
              <option value="cancelled">Cancelada</option>
            </Select>
            <div className="filters-row__actions">
              <Button variant="ghost" icon={Search} onClick={load} loading={loading}>
                Filtrar
              </Button>
            </div>
          </div>

          {feedback ? <div className="alert alert--danger">{feedback}</div> : null}

          <Table
            columns={columns}
            data={items}
            empty={
              <FriendlyEmptyState
                title="Nenhuma cobranca no palco"
                description="Crie uma cobranca nova ou ajuste os filtros para reencontrar a fila certa."
                emoji={"\u{1F381}"}
              />
            }
            renderRow={(item) => {
              const statusMeta = getChargeStatusMeta(item.status);

              return (
                <tr key={item._id}>
                  <td>
                    <div className="table-strong">{item.description}</div>
                    <div className="table-muted">
                      {item.customerId?.name || "Cliente"} - {item.notes || "Sem observacao extra."}
                    </div>
                  </td>
                  <td>{formatBRLFromCents(item.amountCents)}</td>
                  <td>{formatDate(item.dueDate)}</td>
                  <td>
                    <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                  </td>
                  <td>{formatDate(item.nextReminderAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="action-icon" to={`/charges/${item._id}`}>
                        <Eye size={16} />
                      </Link>
                      <button className="action-icon" onClick={() => openEdit(item)}>
                        <Pencil size={16} />
                      </button>
                      <button className="action-icon" onClick={() => setDispatchCharge(item)}>
                        <Send size={16} />
                      </button>
                      <button
                        className="action-icon action-icon--success"
                        onClick={() => handleMarkPaid(item)}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar cobranca" : "Nova cobranca"}
        subtitle="Crie a base que vai alimentar lembretes, historico e disparos manuais."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <Select
            label="Cliente"
            value={form.customerId}
            onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
            required
          >
            <option value="">Selecione...</option>
            {customers.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>

          <Input
            label="Descricao"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            required
          />

          <div className="grid-two">
            <Input
              label="Valor"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="150,00"
              required
            />
            <Input
              label="Vencimento"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              required
            />
          </div>

          <Textarea
            label="Observacoes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />

          <div className="form-section">
            <div>
              <h4>Perfil de cobranca</h4>
              <p className="field-hint">
                Escolha o estilo de abordagem usado nas mensagens desta cobranca.
              </p>
            </div>
            <div className="profile-options">
              <label className={form.messageProfile === "divertido" ? "profile-card profile-card--active" : "profile-card"}>
                <input
                  type="radio"
                  name="messageProfile"
                  value="divertido"
                  checked={form.messageProfile === "divertido"}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, messageProfile: event.target.value }))
                  }
                />
                <div className="profile-card__content">
                  <strong>Divertido</strong>
                  <p>Tom leve e amigavel, sem perder a clareza da cobranca.</p>
                </div>
              </label>

              <label
                className={
                  form.messageProfile === "profissional" ? "profile-card profile-card--active" : "profile-card"
                }
              >
                <input
                  type="radio"
                  name="messageProfile"
                  value="profissional"
                  checked={form.messageProfile === "profissional"}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, messageProfile: event.target.value }))
                  }
                />
                <div className="profile-card__content">
                  <strong>Profissional</strong>
                  <p>Tom objetivo e corporativo. Ideal como padrao mais seguro.</p>
                </div>
              </label>

              <label
                className={
                  form.messageProfile === "empatico" ? "profile-card profile-card--active" : "profile-card"
                }
              >
                <input
                  type="radio"
                  name="messageProfile"
                  value="empatico"
                  checked={form.messageProfile === "empatico"}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, messageProfile: event.target.value }))
                  }
                />
                <div className="profile-card__content">
                  <strong>Empatico</strong>
                  <p>Tom humano e conciliador, aberto a conversa.</p>
                </div>
              </label>
            </div>
          </div>

          <Select
            label="Lembrete automatico"
            value={String(form.autoReminderEnabled)}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                autoReminderEnabled: event.target.value === "true",
              }))
            }
          >
            <option value="true">Ligado</option>
            <option value="false">Desligado</option>
          </Select>

          <div className="modal__footer">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar cobranca
            </Button>
          </div>
        </form>
      </Modal>

      <FriendlyManualDispatchModal
        open={Boolean(dispatchCharge)}
        onClose={() => setDispatchCharge(null)}
        charge={dispatchCharge}
        templates={templates}
        onSuccess={load}
      />
    </div>
  );
}
