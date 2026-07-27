import { google } from "googleapis";
import { Resend } from "resend";

const TIME_ZONE = "America/Sao_Paulo";
const DEFAULT_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 12 * 60;
const SALON_LOCATION = "Pç. Heitor Bastos Tigre, 16355 - Recreio dos Bandeirantes, Rio de Janeiro - RJ, 22790-550";

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const addMinutesToLocalDateTime = (date, time, durationMinutes) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day, hours, minutes + durationMinutes));
  const pad = (value) => String(value).padStart(2, "0");

  return `${result.getUTCFullYear()}-${pad(result.getUTCMonth() + 1)}-${pad(result.getUTCDate())}T${pad(result.getUTCHours())}:${pad(result.getUTCMinutes())}:00`;
};

const parseCredentials = () => {
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error("GOOGLE_CREDENTIALS não configurada.");
  }

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }
  return credentials;
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const formatDateForDisplay = (date) => date.split("-").reverse().join("/");

const buildGoogleCalendarUrl = ({ nome, servico, data, horario, endDateTime }) => {
  const startDateTime = `${data}T${horario}:00`;
  const toCalendarFormat = (value) => value.replace(/[-:]/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Agendamento - ${servico}`,
    dates: `${toCalendarFormat(startDateTime)}/${toCalendarFormat(endDateTime)}`,
    details: `Agendamento de ${nome} no Espaço Priscila Oliveira.`,
    location: SALON_LOCATION,
    ctz: TIME_ZONE
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildConfirmationEmail = ({ nome, servico, data, horario, valor, calendarUrl }) => `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f8f3f4;font-family:Arial,sans-serif;color:#3b2b30;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f3f4;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(79,42,53,.10);">
          <tr>
            <td align="center" style="background:#cf8096;padding:28px 24px;">
              <img src="https://espacopriscilaoliveira.com/imagens/logo.webp" width="92" alt="Espaço Priscila Oliveira" style="display:block;max-width:92px;height:auto;margin-bottom:14px;">
              <h1 style="margin:0;color:#ffffff;font-size:25px;line-height:1.3;">Espaço Priscila Oliveira</h1>
              <p style="margin:8px 0 0;color:#fff4f7;font-size:15px;">Recebemos sua solicitação de agendamento</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Olá, <strong>${escapeHtml(nome)}</strong>! Confira abaixo os detalhes da sua solicitação.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f9;border:1px solid #efd7de;border-radius:12px;">
                <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Cliente</strong><br>${escapeHtml(nome)}</td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Serviço(s)</strong><br>${escapeHtml(servico)}</td></tr>
                <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Data e horário</strong><br>${escapeHtml(formatDateForDisplay(data))} às ${escapeHtml(horario)}</td></tr>
                <tr><td style="padding:14px 18px;"><strong>Valor</strong><br>${escapeHtml(valor || "Valor sob consulta")}</td></tr>
              </table>
              <div style="text-align:center;margin:28px 0 18px;">
                <a href="${escapeHtml(calendarUrl)}" style="display:inline-block;background:#cf8096;color:#ffffff;text-decoration:none;font-weight:bold;padding:15px 22px;border-radius:10px;">📅 Adicionar ao meu Google Agenda</a>
              </div>
              <p style="margin:0;color:#725b63;font-size:13px;line-height:1.6;text-align:center;">A solicitação será confirmada pela Priscila via WhatsApp.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  if (!process.env.GOOGLE_CALENDAR_ID || !process.env.RESEND_API_KEY) {
    console.error("GOOGLE_CALENDAR_ID ou RESEND_API_KEY não configurada.");
    return res.status(500).json({ success: false, error: "Serviço de confirmação não configurado." });
  }

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!payload || typeof payload !== "object") throw new Error("Payload inválido.");
  } catch {
    return res.status(400).json({ success: false, error: "JSON inválido." });
  }

  const nome = typeof payload.nome === "string" ? payload.nome.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const telefone = typeof payload.telefone === "string" ? payload.telefone.trim() : "";
  const servico = typeof payload.servico === "string" ? payload.servico.trim() : "";
  const valor = typeof payload.valor === "string" ? payload.valor.trim() : "Valor sob consulta";
  const data = typeof payload.data === "string" ? payload.data.trim() : "";
  const horario = typeof payload.horario === "string" ? payload.horario.trim() : "";
  const requestedDuration = Number(payload.duracaoTotal);
  const duracaoTotal = Number.isInteger(requestedDuration) && requestedDuration > 0
    ? requestedDuration
    : DEFAULT_DURATION_MINUTES;

  if (!nome || nome.length > 120 || !servico || servico.length > 500) {
    return res.status(400).json({ success: false, error: "Nome ou serviço inválido." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || telefone.length < 8 || telefone.length > 30) {
    return res.status(400).json({ success: false, error: "E-mail ou telefone inválido." });
  }

  if (!isValidDate(data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
    return res.status(400).json({ success: false, error: "Data ou horário inválido." });
  }

  if (duracaoTotal > MAX_DURATION_MINUTES) {
    return res.status(400).json({ success: false, error: "Duração inválida." });
  }

  const startDateTime = `${data}T${horario}:00`;
  const endDateTime = addMinutesToLocalDateTime(data, horario, duracaoTotal);
  const calendarUrl = buildGoogleCalendarUrl({ nome, servico, data, horario, endDateTime });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: parseCredentials(),
      scopes: ["https://www.googleapis.com/auth/calendar"]
    });

    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `${servico} — ${nome}`,
        description: [
          `Cliente: ${nome}`,
          `E-mail: ${email}`,
          `Telefone/WhatsApp: ${telefone}`,
          `Serviço(s): ${servico}`,
          `Valor: ${valor}`,
          `Duração estimada: ${duracaoTotal} minutos`,
          "Solicitação criada pelo site do Espaço Priscila Oliveira."
        ].join("\n"),
        location: SALON_LOCATION,
        start: { dateTime: startDateTime, timeZone: TIME_ZONE },
        end: { dateTime: endDateTime, timeZone: TIME_ZONE }
      }
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: "Espaço Priscila Oliveira <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos sua solicitação de agendamento",
      html: buildConfirmationEmail({ nome, servico, data, horario, valor, calendarUrl })
    });

    if (emailError) {
      throw new Error(`Resend: ${emailError.message || "falha ao enviar e-mail"}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Falha ao criar evento ou enviar confirmação:", error?.message || error);
    return res.status(500).json({ success: false, error: "Não foi possível concluir a confirmação." });
  }
}
