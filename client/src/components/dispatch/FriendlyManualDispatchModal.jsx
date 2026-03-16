import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal.jsx";
import Select from "../ui/Select.jsx";
import { Input, Textarea } from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { extractApiError } from "../../app/api.js";
import { sendManualDispatch } from "../../services/dispatches.service.js";
import { normalizePhone } from "../../utils/phone.js";
import { formatBRLFromCents } from "../../utils/currency.js";
import { formatDate } from "../../utils/date.js";

function buildProfiledPreview({ charge, baseContent }) {
  const profile = charge?.messageProfile || "profissional";
  const customerName = charge?.customerId?.name || "Cliente";
  const amount = formatBRLFromCents(charge?.amountCents);
  const dueDate = formatDate(charge?.dueDate);
  const description = charge?.description || "cobrança";
  const core = String(baseContent || "").trim();

  if (profile === "divertido") {
    const intro = `Oi, ${customerName}! Vamos deixar as contas em dia de um jeito leve?`;
    const outro =
      "Se já estiver tudo certo por aí, pode desconsiderar. Se precisar de algo, é só responder por aqui.";
    if (!core) {
      return `${intro} Estou falando sobre '${description}' no valor de ${amount}, com vencimento em ${dueDate}. ${outro}`;
    }
    return `${intro} ${core} ${outro}`;
  }

  if (profile === "empatico") {
    const intro = `Olá, ${customerName}. Espero que você esteja bem.`;
    const outro =
      "Se precisar ajustar prazos ou tiver qualquer dúvida sobre essa cobrança, responda esta mensagem para alinharmos da melhor forma.";
    if (!core) {
      return `${intro} Estamos entrando em contato sobre '${description}' no valor de ${amount}, com vencimento em ${dueDate}. ${outro}`;
    }
    return `${intro} ${core} ${outro}`;
  }

  const intro = `Olá, ${customerName}. Esta é uma mensagem sobre uma cobrança registrada em seu nome.`;
  if (!core) {
    return `${intro} Referente a '${description}' no valor de ${amount}, com vencimento em ${dueDate}. Em caso de dúvidas, estamos à disposição por este canal.`;
  }

  return `${intro} ${core}`;
}

function renderPreview(templateContent, charge) {
  if (!templateContent || !charge) return "";
  const customer = charge.customerId || {};

  const base = String(templateContent)
    .replaceAll("{{customerName}}", customer.name || "")
    .replaceAll("{{amount}}", formatBRLFromCents(charge.amountCents))
    .replaceAll("{{dueDate}}", formatDate(charge.dueDate))
    .replaceAll("{{chargeDescription}}", charge.description || "");

  return buildProfiledPreview({ charge, baseContent: base });
}

export default function FriendlyManualDispatchModal({
  open,
  onClose,
  charge,
  templates = [],
  onSuccess,
}) {
  const [templateId, setTemplateId] = useState("");
  const [phone, setPhone] = useState("");
  const [finalMessage, setFinalMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const activeTemplates = useMemo(
    () => templates.filter((item) => item.isActive),
    [templates]
  );

  useEffect(() => {
    if (!open || !charge) return;

    const initialTemplate =
      activeTemplates.find((item) => item.category === "manual") ||
      activeTemplates[0] ||
      null;

    setTemplateId(initialTemplate?._id || "");
    setPhone(charge.customerId?.phone || "");
    setFinalMessage(renderPreview(initialTemplate?.content || "", charge));
    setFeedback("");
  }, [open, charge, activeTemplates]);

  useEffect(() => {
    if (!charge) return;

    const template = activeTemplates.find((item) => item._id === templateId);
    if (!template) return;
    setFinalMessage(renderPreview(template.content, charge));
  }, [templateId, activeTemplates, charge]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!charge?._id) return;

    try {
      setSaving(true);
      setFeedback("");

      await sendManualDispatch({
        chargeId: charge._id,
        templateId: templateId || undefined,
        phone: normalizePhone(phone),
        finalMessage,
      });

      onSuccess?.();
      onClose?.();
    } catch (error) {
      setFeedback(extractApiError(error, "Nao foi possivel enviar a mensagem."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ajuste fino da mensagem ${"\u{1F4AC}"}`}
      subtitle="Escolha um template, ajuste o tom e envie com clareza."
      width="780px"
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="grid-two">
          <Select
            label="Template base"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            <option value="">Mensagem customizada</option>
            {activeTemplates.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.category}
              </option>
            ))}
          </Select>

          <Input
            label="Telefone de envio"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="5511999999999"
          />
        </div>

        <div className="info-inline">
          <strong>{"\u{1F381}"} cobranca em foco:</strong> {charge?.description} -{" "}
          {formatBRLFromCents(charge?.amountCents)} - vencimento em{" "}
          {formatDate(charge?.dueDate)}
        </div>

        <Textarea
          label="Mensagem final"
          rows={9}
          value={finalMessage}
          onChange={(event) => setFinalMessage(event.target.value)}
          hint="Dica: mantenha o texto simpatico, claro e objetivo. Um emoji leve ja basta."
        />

        {feedback ? <div className="alert alert--danger">{feedback}</div> : null}

        <div className="modal__footer">
          <Button variant="ghost" onClick={onClose}>
            Voltar
          </Button>
          <Button type="submit" loading={saving}>
            Enviar com carinho
          </Button>
        </div>
      </form>
    </Modal>
  );
}
