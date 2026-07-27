import { google } from "googleapis";

const TIME_ZONE = "America/Sao_Paulo";
const DEFAULT_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 12 * 60;

const jsonResponse = (body, status = 200) => Response.json(body, { status });

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

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "Método não permitido." }, 405);
    }

    if (!process.env.GOOGLE_CALENDAR_ID) {
      console.error("GOOGLE_CALENDAR_ID não configurada.");
      return jsonResponse({ success: false, error: "Serviço de calendário não configurado." }, 500);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ success: false, error: "JSON inválido." }, 400);
    }

    const nome = typeof payload.nome === "string" ? payload.nome.trim() : "";
    const servico = typeof payload.servico === "string" ? payload.servico.trim() : "";
    const data = typeof payload.data === "string" ? payload.data.trim() : "";
    const horario = typeof payload.horario === "string" ? payload.horario.trim() : "";
    const requestedDuration = Number(payload.duracaoTotal);
    const duracaoTotal = Number.isInteger(requestedDuration) && requestedDuration > 0
      ? requestedDuration
      : DEFAULT_DURATION_MINUTES;

    if (!nome || nome.length > 120 || !servico || servico.length > 500) {
      return jsonResponse({ success: false, error: "Nome ou serviço inválido." }, 400);
    }

    if (!isValidDate(data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
      return jsonResponse({ success: false, error: "Data ou horário inválido." }, 400);
    }

    if (duracaoTotal > MAX_DURATION_MINUTES) {
      return jsonResponse({ success: false, error: "Duração inválida." }, 400);
    }

    const startDateTime = `${data}T${horario}:00`;
    const endDateTime = addMinutesToLocalDateTime(data, horario, duracaoTotal);

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
            `Serviço(s): ${servico}`,
            `Duração estimada: ${duracaoTotal} minutos`,
            "Solicitação criada pelo site do Espaço Priscila Oliveira."
          ].join("\n"),
          location: "Pç. Heitor Bastos Tigre, 16355 - Recreio dos Bandeirantes, Rio de Janeiro - RJ, 22790-550",
          start: {
            dateTime: startDateTime,
            timeZone: TIME_ZONE
          },
          end: {
            dateTime: endDateTime,
            timeZone: TIME_ZONE
          }
        }
      });

      return jsonResponse({ success: true });
    } catch (error) {
      console.error("Falha ao criar evento no Google Calendar:", error?.message || error);
      return jsonResponse({ success: false, error: "Não foi possível criar o evento." }, 500);
    }
  }
};
