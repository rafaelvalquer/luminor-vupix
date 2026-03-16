import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  createGentleProfile,
  createTemplate,
  deleteTemplate,
  listGentleProfiles,
  listTemplates,
  updateTemplate,
} from "../services/templates.service.js";
import { formatDateTime } from "../utils/date.js";

const initialForm = {
  name: "",
  category: "manual",
  content: "",
  isActive: true,
};

const initialGentleForm = {
  name: "",
  before_due: "",
  due_today: "",
  after_due: "",
  manual: "",
};

export default function TemplatesPage() {
  const [items, setItems] = useState([]);
  const [gentleProfiles, setGentleProfiles] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [gentleForm, setGentleForm] = useState(initialGentleForm);
  const [gentleSaving, setGentleSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [templateItems, gentleItems] = await Promise.all([
        listTemplates(),
        listGentleProfiles(),
      ]);
      setItems(templateItems);
      setGentleProfiles(gentleItems);
      setFeedback("");
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao carregar templates."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { key: "name", label: "Template" },
      { key: "category", label: "Categoria" },
      { key: "active", label: "Status" },
      { key: "updatedAt", label: "Atualizado" },
      { key: "actions", label: "Ações" },
    ],
    [],
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
      category: item.category || "manual",
      content: item.content || "",
      isActive: item.isActive !== false,
    });
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      if (editing?._id) await updateTemplate(editing._id, form);
      else await createTemplate(form);
      setOpen(false);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao salvar template."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Excluir o template "${item.name}"?`)) return;
    try {
      await deleteTemplate(item._id);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao excluir template."));
    }
  }

  async function handleCreateGentleProfile(event) {
    event.preventDefault();
    try {
      setGentleSaving(true);
      await createGentleProfile({
        name: gentleForm.name,
        phrases: {
          before_due: gentleForm.before_due,
          due_today: gentleForm.due_today,
          after_due: gentleForm.after_due,
          manual: gentleForm.manual,
        },
      });
      setGentleForm(initialGentleForm);
      await load();
    } catch (error) {
      setFeedback(extractApiError(error, "Falha ao criar perfil gentil."));
    } finally {
      setGentleSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="grid-two-equal">
        <Card>
          <CardHeader
            title="Templates de mensagem"
            subtitle="Mensagens reutilizáveis com variáveis de negócio."
            action={
              <Button icon={Plus} onClick={openCreate}>
                Novo template
              </Button>
            }
          />
          <CardBody>
            {feedback ? (
              <div className="alert alert--danger">{feedback}</div>
            ) : null}
            <Table
              columns={columns}
              data={items}
              empty={
                <EmptyState
                  title="Nenhum template cadastrado"
                  description="Crie templates para manual, pré-vencimento, vencimento e pós-vencimento."
                />
              }
              renderRow={(item) => (
                <tr key={item._id}>
                  <td>
                    <div className="table-strong">{item.name}</div>
                    <div className="table-muted clamp-2">{item.content}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <Badge tone={item.isActive ? "success" : "muted"}>
                      {item.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td>{formatDateTime(item.updatedAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-icon"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="action-icon action-icon--danger"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Configurar templates"
            subtitle="Perfis gentis com 4 frases para cada momento da cobrança."
          />
          <CardBody>
            <div className="stack-list">
              {gentleProfiles.map((profile) => (
                <div key={profile.profileKey} className="gentle-profile-card">
                  <div className="gentle-profile-card__header">
                    <div>
                      <strong>{profile.name}</strong>
                      {profile.isSystemDefault ? (
                        <Badge tone="info" className="gentle-profile-card__badge">
                          Default gentil
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="gentle-profile-card__grid">
                    <div className="gentle-profile-card__item">
                      <div className="gentle-profile-card__label">Antes do vencimento</div>
                      <p className="gentle-profile-card__text">
                        {profile.phrases.before_due?.content || "—"}
                      </p>
                    </div>
                    <div className="gentle-profile-card__item">
                      <div className="gentle-profile-card__label">No dia do vencimento</div>
                      <p className="gentle-profile-card__text">
                        {profile.phrases.due_today?.content || "—"}
                      </p>
                    </div>
                    <div className="gentle-profile-card__item">
                      <div className="gentle-profile-card__label">Após o vencimento</div>
                      <p className="gentle-profile-card__text">
                        {profile.phrases.after_due?.content || "—"}
                      </p>
                    </div>
                    <div className="gentle-profile-card__item">
                      <div className="gentle-profile-card__label">Disparo manual</div>
                      <p className="gentle-profile-card__text">
                        {profile.phrases.manual?.content || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <hr className="divider" />

            <form className="form-grid" onSubmit={handleCreateGentleProfile}>
              <Input
                label="Nome do perfil gentil"
                value={gentleForm.name}
                onChange={(event) =>
                  setGentleForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
              <Textarea
                label="Antes do vencimento"
                rows={3}
                value={gentleForm.before_due}
                onChange={(event) =>
                  setGentleForm((prev) => ({ ...prev, before_due: event.target.value }))
                }
                required
              />
              <Textarea
                label="No dia do vencimento"
                rows={3}
                value={gentleForm.due_today}
                onChange={(event) =>
                  setGentleForm((prev) => ({ ...prev, due_today: event.target.value }))
                }
                required
              />
              <Textarea
                label="Após o vencimento"
                rows={3}
                value={gentleForm.after_due}
                onChange={(event) =>
                  setGentleForm((prev) => ({ ...prev, after_due: event.target.value }))
                }
                required
              />
              <Textarea
                label="Disparo manual"
                rows={3}
                value={gentleForm.manual}
                onChange={(event) =>
                  setGentleForm((prev) => ({ ...prev, manual: event.target.value }))
                }
                required
              />

              <div className="modal__footer">
                <Button type="submit" loading={gentleSaving}>
                  Salvar perfil gentil
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar template" : "Novo template"}
        subtitle="Monte a mensagem base que será renderizada no backend."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <Select
            label="Categoria"
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value }))
            }
          >
            <option value="manual">manual</option>
            <option value="before_due">before_due</option>
            <option value="due_today">due_today</option>
            <option value="after_due">after_due</option>
            <option value="custom">custom</option>
          </Select>
          <Textarea
            label="Conteúdo"
            value={form.content}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, content: event.target.value }))
            }
            rows={10}
            hint="Use as variáveis suportadas para tornar o template dinâmico."
            required
          />
          <Select
            label="Status"
            value={String(form.isActive)}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                isActive: event.target.value === "true",
              }))
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
              Salvar template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
