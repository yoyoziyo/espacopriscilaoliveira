import { google } from "googleapis";
import { Resend } from "resend";
import {
  SALON_LOCATION,
  TIME_ZONE,
  addMinutesToLocalDateTime,
  calendarEventIdFor,
  getBookingPlan,
  normalizeServiceNames,
  parseGoogleCredentials,
  reserveBooking
} from "./_booking.js";

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const formatDateForDisplay = (date) => date.split("-").reverse().join("/");

const buildGoogleCalendarUrl = ({ booking, endDateTime }) => {
  const startDateTime = `${booking.data}T${booking.horario}:00`;
  const toCalendarFormat = (value) => value.replace(/[-:]/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${booking.profissionais.join(" + ")} — ${booking.servicos.join(" + ")} — ${booking.nome}`,
    dates: `${toCalendarFormat(startDateTime)}/${toCalendarFormat(endDateTime)}`,
    details: `Agendamento confirmado. Código: ${booking.codigoAgendamento}.`,
    location: SALON_LOCATION,
    ctz: TIME_ZONE
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildConfirmationEmail = ({ booking, calendarUrl }) => `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f8f3f4;font-family:Arial,sans-serif;color:#3b2b30;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f3f4;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(79,42,53,.10);">
          <tr><td align="center" style="background:#cf8096;padding:28px 24px;">
            <img src="https://espacopriscilaoliveira.com/imagens/logo.webp" width="92" alt="Espaço Priscila Oliveira" style="display:block;max-width:92px;height:auto;margin-bottom:14px;">
            <h1 style="margin:0;color:#ffffff;font-size:25px;line-height:1.3;">Espaço Priscila Oliveira</h1>
            <p style="margin:8px 0 0;color:#fff4f7;font-size:15px;">Seu agendamento está confirmado</p>
          </td></tr>
          <tr><td style="padding:30px 28px;">
            <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Olá, <strong>${escapeHtml(booking.nome)}</strong>! Seu horário já está reservado.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7f9;border:1px solid #efd7de;border-radius:12px;">
              <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Código</strong><br>${escapeHtml(booking.codigoAgendamento)}</td></tr>
              <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Cliente</strong><br>${escapeHtml(booking.nome)}</td></tr>
              <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Profissional(is)</strong><br>${escapeHtml(booking.profissionais.join(" e "))}</td></tr>
              <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Serviço(s)</strong><br>${escapeHtml(booking.servicos.join(", "))}</td></tr>
              <tr><td style="padding:14px 18px;border-bottom:1px solid #efd7de;"><strong>Data e horário</strong><br>${escapeHtml(formatDateForDisplay(booking.data))} às ${escapeHtml(booking.horario)}</td></tr>
              <tr><td style="padding:14px 18px;"><strong>Valor</strong><br>${escapeHtml(booking.valor)}</td></tr>
            </table>
            <div style="text-align:center;margin:28px 0 18px;">
              <a href="${escapeHtml(calendarUrl)}" style="display:inline-block;background:#cf8096;color:#ffffff;text-decoration:none;font-weight:bold;padding:15px 22px;border-radius:10px;">📅 Adicionar ao meu Google Agenda</a>
            </div>
            <p style="margin:0;color:#725b63;font-size:13px;line-height:1.6;text-align:center;">Se precisar remarcar ou cancelar, fale conosco pelo WhatsApp e informe o código do agendamento.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const createCalendarEvent = async ({ booking, idempotencyKey, endDateTime }) => {
  if (!process.env.GOOGLE_CALENDAR_ID) throw new Error("GOOGLE_CALENDAR_ID não configurada.");
  const credentials = parseGoogleCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/calendar"] });
  const calendar = google.calendar({ version: "v3", auth });
  const eventId = calendarEventIdFor(idempotencyKey);
  try {
    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        id: eventId,
        summary: `${booking.profissionais.join(" + ")} — ${booking.servicos.join(" + ")} — ${booking.nome}`,
        description: [
          `Código: ${booking.codigoAgendamento}`,
          "Status: confirmado",
          `Cliente: ${booking.nome}`,
          `E-mail: ${booking.email}`,
          `Telefone/WhatsApp: ${booking.telefone}`,
          `Profissional(is): ${booking.profissionais.join(", ")}`,
          `Serviço(s): ${booking.servicos.join(", ")}`,
          `Valor: ${booking.valor}`,
          `Duração estimada: ${booking.duracaoTotal} minutos`
        ].join("\n"),
        location: SALON_LOCATION,
        start: { dateTime: `${booking.data}T${booking.horario}:00`, timeZone: TIME_ZONE },
        end: { dateTime: endDateTime, timeZone: TIME_ZONE }
      }
    });
  } catch (error) {
    if (error?.code !== 409 && error?.response?.status !== 409) throw error;
  }
  return eventId;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Método não permitido." });

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const nome = typeof payload?.nome === "string" ? payload.nome.trim() : "";
    const email = typeof payload?.email === "string" ? payload.email.trim() : "";
    const telefone = typeof payload?.telefone === "string" ? payload.telefone.trim() : "";
    const data = typeof payload?.data === "string" ? payload.data.trim() : "";
    const horario = typeof payload?.horario === "string" ? payload.horario.trim() : "";
    const idempotencyKey = typeof payload?.idempotencyKey === "string" ? payload.idempotencyKey.trim() : "";
    const serviceNames = normalizeServiceNames(payload || {});

    if (!nome || nome.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || telefone.length < 8 || telefone.length > 30) {
      return res.status(400).json({ success: false, error: "Nome, e-mail ou telefone inválido." });
    }
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
      return res.status(400).json({ success: false, error: "Identificador do agendamento inválido." });
    }

    const plan = getBookingPlan({ serviceNames, data, horario });
    const reservation = await reserveBooking({ idempotencyKey, nome, email, telefone, data, horario, plan });
    const booking = reservation.booking;
    const endDateTime = addMinutesToLocalDateTime(booking.data, booking.horario, booking.duracaoTotal);
    const calendarUrl = buildGoogleCalendarUrl({ booking, endDateTime });
    const warnings = [];

    if (booking.calendarStatus !== "criado") {
      try {
        const eventId = await createCalendarEvent({ booking, idempotencyKey, endDateTime });
        await reservation.bookingRef.update({ calendarStatus: "criado", calendarEventId: eventId, calendarAtualizadoEm: new Date() });
        booking.calendarStatus = "criado";
      } catch (error) {
        console.error("Agendamento confirmado, mas o calendário falhou:", error?.message || error);
        warnings.push("calendar");
        await reservation.bookingRef.update({ calendarStatus: "erro", calendarErro: String(error?.message || error).slice(0, 500) });
      }
    }

    if (booking.emailStatus !== "enviado") {
      try {
        if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada.");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: "Espaço Priscila Oliveira <agendamento@espacopriscilaoliveira.com>",
          to: [booking.email],
          subject: `Agendamento confirmado — ${booking.codigoAgendamento}`,
          html: buildConfirmationEmail({ booking, calendarUrl })
        }, { idempotencyKey: `booking-confirmation/${idempotencyKey}` });
        if (error) throw new Error(error.message || "Falha ao enviar e-mail.");
        await reservation.bookingRef.update({ emailStatus: "enviado", emailAtualizadoEm: new Date() });
        booking.emailStatus = "enviado";
      } catch (error) {
        console.error("Agendamento confirmado, mas o e-mail falhou:", error?.message || error);
        warnings.push("email");
        await reservation.bookingRef.update({ emailStatus: "erro", emailErro: String(error?.message || error).slice(0, 500) });
      }
    }

    return res.status(200).json({
      success: true,
      confirmed: true,
      existing: reservation.existing,
      codigoAgendamento: booking.codigoAgendamento,
      profissionais: booking.profissionais,
      servicos: booking.servicos,
      valor: booking.valor,
      duracaoTotal: booking.duracaoTotal,
      calendarUrl,
      warnings
    });
  } catch (error) {
    console.error("Falha ao confirmar agendamento:", error?.message || error);
    return res.status(error?.statusCode || 500).json({
      success: false,
      error: error?.statusCode ? error.message : "Não foi possível confirmar o agendamento."
    });
  }
}

