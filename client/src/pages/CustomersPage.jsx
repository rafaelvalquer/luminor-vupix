import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input, Textarea } from "../components/ui/Input.jsx";
import Modal from "../components/ui/Modal.jsx";
import Select from "../components/ui/Select.jsx";
import Badge from "../components/ui/Badge.jsx";
import Table from "../components/ui/Table.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { extractApiError } from "../app/api.js";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "../services/customers.service.js";
import { formatPhone } from "../utils/phone.js";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  tags: "",
  isActive: true,
};

export default function CustomersPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const result = await listCustomers({ search, isActive });
      setItems(result);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao carregar clientes."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", label: "Cliente" },
      { key: "phone", label: "Telefone" },
      { key: "email", label: "E-mail" },
      { key: "tags", label: "Tags" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Ações" },
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
      name: item.name || "",
      phone: item.phone || "",
      email: item.email || "",
      notes: item.notes || "",
      tags: (item.tags || []).join(", "),
      isActive: Boolean(item.isActive),
    });
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        tags: String(form.tags || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editing?._id) {
        await updateCustomer(editing._id, payload);
      } else {
        await createCustomer(payload);
      }

      setOpen(false);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao salvar cliente."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Excluir o cliente "${item.name}"?`);
    if (!confirmed) return;

    try {
      await deleteCustomer(item._id);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao excluir cliente."));
    }
  }

  return (
    <div className="page-stack">
      <Card>
        <CardHeader
          title="Base de clientes"
          subtitle="Filtre, cadastre e mantenha a carteira organizada."
          action={
            <Button icon={Plus} onClick={openCreate}>
              Novo cliente
            </Button>
          }
        />
        <CardBody>
          <div className="filters-row">
            <Input
              label="Busca"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, telefone, e-mail ou tag"
            />
            <Select
              label="Status"
              value={isActive}
              onChange={(event) => setIsActive(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
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
              <EmptyState
                title="Nenhum cliente encontrado"
                description="Crie seu primeiro cliente ou ajuste os filtros."
              />
            }
            renderRow={(item) => (
              <tr key={item._id}>
                <td>
                  <div className="table-strong">{item.name}</div>
                  <div className="table-muted">{item.notes || "Sem observações"}</div>
                </td>
                <td>{formatPhone(item.phone)}</td>
                <td>{item.email || "—"}</td>
                <td>
                  <div className="tag-list">
                    {(item.tags || []).length
                      ? item.tags.map((tag) => <span key={tag} className="tag-chip">{tag}</span>)
                      : "—"}
                  </div>
                </td>
                <td>
                  <Badge tone={item.isActive ? "success" : "muted"}>
                    {item.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="action-icon" onClick={() => openEdit(item)}>
                      <Pencil size={16} />
                    </button>
                    <button className="action-icon action-icon--danger" onClick={() => handleDelete(item)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar cliente" : "Novo cliente"}
        subtitle="Dados básicos para cobrança e comunicação."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="grid-two">
            <Input
              label="Nome"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="5511999999999"
              required
            />
          </div>

          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />

          <Input
            label="Tags"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            hint="Separe por vírgula. Ex.: premium, vencimento-dia-10"
          />

          <Textarea
            label="Observações"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />

          <Select
            label="Situação"
            value={String(form.isActive)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))
            }
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>

          <div className="modal__footer">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
