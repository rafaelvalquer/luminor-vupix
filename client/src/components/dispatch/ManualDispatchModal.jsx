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

function renderPreview(templateContent, charge) {
  if (!templateContent || !charge) return "";
  const customer = charge.customerId || {};
  return String(templateContent)
    .replaceAll("{{customerName}}", customer.name || "")
    .replaceAll("{{amount}}", formatBRLFromCents(charge.amountCents))
    .replaceAll("{{dueDate}}", formatDate(charge.dueDate))
    .replaceAll("{{chargeDescription}}", charge.description || "");
}

export default function ManualDispatchModal({
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
    [templates],
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
      setFeedback(extractApiError(error, "Falha ao enviar mensagem."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Disparo manual via WhatsApp"
      subtitle="Selecione o template, ajuste a mensagem final e envie pelo gateway."
      width="760px"
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="grid-two">
          <Select
            label="Template"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          >
            <option value="">Mensagem customizada</option>
            {activeTemplates.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} · {item.category}
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
          <strong>Cobrança:</strong> {charge?.description} ·{" "}
          {formatBRLFromCents(charge?.amountCents)} · vencimento em{" "}
          {formatDate(charge?.dueDate)}
        </div>

        <Textarea
          label="Mensagem final"
          rows={9}
          value={finalMessage}
          onChange={(event) => setFinalMessage(event.target.value)}
          hint="Você pode ajustar livremente antes do envio."
        />

        {feedback ? (
          <div className="alert alert--danger">{feedback}</div>
        ) : null}

        <div className="modal__footer">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Enviar mensagem
          </Button>
        </div>
      </form>
    </Modal>
  );
}
