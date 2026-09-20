import { createHash } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const TIME_ZONE = "America/Sao_Paulo";
export const SLOT_INTERVAL = 30;
export const SALON_LOCATION = "Pç. Heitor Bastos Tigre, 16355 - Recreio dos Bandeirantes, Rio de Janeiro - RJ, 22790-550";

export const SCHEDULES = {
  hair: { label: "Cuidados Capilares", professional: "Lilian", days: [2, 3, 4, 5, 6], openMinutes: 10 * 60, closeMinutes: 19 * 60 },
  nails: { label: "Unhas e Alongamentos", professional: "Cintia", days: [2, 3, 4, 5, 6], openMinutes: 10 * 60, closeMinutes: 19 * 60 },
  aesthetics: { label: "Olhar e Simetria", professional: "Priscila", days: [1, 4], openMinutes: 13 * 60 + 30, closeMinutes: 19 * 60 }
};

export const SERVICE_CATALOG = {
  "Escova Premium": { category: "hair", duration: 60, price: "A partir de R$ 70" },
  "Tratamento com Ozônio": { category: "hair", duration: 60, price: "R$ 150" },
  "Mechas Topo ou Contorno": { category: "hair", duration: 240, price: "A partir de R$ 350" },
  "Surf Blond": { category: "hair", duration: 300, price: "A partir de R$ 350" },
  "Moreno Iluminado": { category: "hair", duration: 240, price: "R$ 450" },
  "Retoque de Raiz": { category: "hair", duration: 90, price: "R$ 160" },
  "Coloração": { category: "hair", duration: 90, price: "R$ 190" },
  "Tratamento Capilar": { category: "hair", duration: 90, price: "R$ 130" },
  "Botox Capilar": { category: "hair", duration: 60, price: "P: R$150 | M: R$200 | G: R$250" },
  "Alinhamento Térmico": { category: "hair", duration: 60, price: "P: R$180 | M: R$230 | G: R$280" },
  "Alongamento em Acrílico": { category: "nails", duration: 180, price: "R$ 200" },
  "Alongamento em Fibra": { category: "nails", duration: 180, price: "R$ 180" },
  "Banho de Gel": { category: "nails", duration: 90, price: "R$ 130" },
  "Esmaltação em Gel": { category: "nails", duration: 30, price: "R$ 60" },
  "Manutenção de Fibra": { category: "nails", duration: 60, price: "R$ 135" },
  "Manutenção de Acrílico": { category: "nails", duration: 60, price: "R$ 140" },
  "Remoção de Alongamento": { category: "nails", duration: 120, price: "R$ 60" },
  "Reposição de Unha": { category: "nails", duration: 60, price: "R$ 10 por unha" },
  "Pé e Mão Simples": { category: "nails", duration: 80, price: "R$ 60" },
  "Apenas Pé": { category: "nails", duration: 30, price: "R$ 35" },
  "Apenas Mão": { category: "nails", duration: 30, price: "R$ 35" },
  "Spa dos Pés": { category: "nails", duration: 60, price: "R$ 80" },
  "Designer Simples": { category: "aesthetics", duration: 40, price: "R$ 45" },
  "Designer com Henna": { category: "aesthetics", duration: 40, price: "R$ 65" },
  "Designer com Tintura": { category: "aesthetics", duration: 40, price: "R$ 65" }
};

export const parseCredentials = () => {
  if (!process.env.GOOGLE_CREDENTIALS) throw new Error("GOOGLE_CREDENTIALS não configurada.");
  const raw = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  return {
    ...raw,
    project_id: raw.project_id || "espaco-priscila-oliveira",
    private_key: raw.private_key?.replace(/\\n/g, "\n")
  };
};

export const getAdminDb = () => {
  const appName = "booking-server";
  let app = getApps().find((candidate) => candidate.name === appName);
  if (!app) {
    const credentials = parseCredentials();
    app = initializeApp({
      credential: cert({
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key
      }),
      projectId: credentials.project_id
    }, appName);
  }
  return getFirestore(app);
};

export const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const normalized = minutes % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
};

export const addMinutesToLocalDateTime = (date, time, durationMinutes) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day, hours, minutes + durationMinutes));
  const pad = (value) => String(value).padStart(2, "0");
  return `${result.getUTCFullYear()}-${pad(result.getUTCMonth() + 1)}-${pad(result.getUTCDate())}T${pad(result.getUTCHours())}:${pad(result.getUTCMinutes())}:00`;
};

export const normalizeServiceNames = (payload) => {
  const values = Array.isArray(payload.servicos)
    ? payload.servicos
    : (typeof payload.servico === "string" ? payload.servico.split(",") : []);
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
};

export const getBookingPlan = ({ serviceNames, data, horario }) => {
  if (!isValidDate(data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
    throw Object.assign(new Error("Data ou horário inválido."), { statusCode: 400 });
  }
  if (!serviceNames.length || serviceNames.some((name) => !SERVICE_CATALOG[name])) {
    throw Object.assign(new Error("Um ou mais serviços são inválidos ou ainda não estão disponíveis."), { statusCode: 400 });
  }

  const services = serviceNames.map((name) => ({ name, ...SERVICE_CATALOG[name] }));
  const categories = [...new Set(services.map((service) => service.category))];
  const rules = categories.map((category) => SCHEDULES[category]);
  const allowedDays = rules.reduce((days, rule) => days.filter((day) => rule.days.includes(day)), [...rules[0].days]);
  const [year, month, day] = data.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const startMinutes = timeToMinutes(horario);
  const openMinutes = Math.max(...rules.map((rule) => rule.openMinutes));
  const closeMinutes = Math.min(...rules.map((rule) => rule.closeMinutes));

  if (!allowedDays.includes(weekday)) {
    throw Object.assign(new Error("A data não está disponível para os serviços escolhidos."), { statusCode: 400 });
  }
  if (startMinutes < openMinutes || startMinutes > closeMinutes || startMinutes % SLOT_INTERVAL !== 0) {
    throw Object.assign(new Error("O horário não está disponível para os serviços escolhidos."), { statusCode: 400 });
  }

  const duration = services.reduce((total, service) => total + service.duration, 0);
  const professionals = [...new Set(categories.map((category) => SCHEDULES[category].professional))];
  const value = services.map((service) => `${service.name}: ${service.price}`).join(" | ");
  const slots = [];
  for (let minute = startMinutes; minute < startMinutes + duration; minute += SLOT_INTERVAL) {
    slots.push(minutesToTime(minute));
  }
  return { services, serviceNames, categories, professionals, duration, value, startMinutes, slots };
};

export const categoriesForStoredBooking = (booking) => {
  if (Array.isArray(booking.categorias) && booking.categorias.length) return booking.categorias;
  const names = Array.isArray(booking.servicos)
    ? booking.servicos
    : (typeof booking.servico === "string" ? booking.servico.split(",").map((name) => name.trim()) : []);
  const inferred = names.map((name) => SERVICE_CATALOG[name]?.category).filter(Boolean);
  return inferred.length ? [...new Set(inferred)] : Object.keys(SCHEDULES);
};

export const bookingOverlaps = (booking, plan) => {
  if (booking.status === "cancelado") return false;
  if (!categoriesForStoredBooking(booking).some((category) => plan.categories.includes(category))) return false;
  const bookingStart = timeToMinutes(booking.horario || "00:00");
  const bookingDuration = Number(booking.duracaoTotal) || 60;
  return plan.startMinutes < bookingStart + bookingDuration && plan.startMinutes + plan.duration > bookingStart;
};

const hash = (value) => createHash("sha256").update(value).digest("hex");
export const bookingCodeFor = (idempotencyKey) => `EPO-${hash(idempotencyKey).slice(0, 8).toUpperCase()}`;
export const calendarEventIdFor = (idempotencyKey) => `epo${hash(idempotencyKey).slice(0, 32)}`;

export const reserveBooking = async ({ idempotencyKey, nome, email, telefone, data, horario, plan }) => {
  const db = getAdminDb();
  const bookingRef = db.collection("agendamentos").doc(idempotencyKey);
  const code = bookingCodeFor(idempotencyKey);
  const lockRefs = plan.categories.flatMap((category) => plan.slots.map((slot) => ({
    category,
    slot,
    ref: db.collection("reservas").doc(`${data}_${category}_${slot.replace(":", "-")}`)
  })));

  return db.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (bookingSnapshot.exists) return { booking: bookingSnapshot.data(), existing: true, db, bookingRef };

    const dayQuery = db.collection("agendamentos").where("data", "==", data);
    const daySnapshot = await transaction.get(dayQuery);
    if (daySnapshot.docs.some((document) => bookingOverlaps(document.data(), plan))) {
      throw Object.assign(new Error("O horário selecionado acabou de ficar indisponível."), { statusCode: 409 });
    }

    const lockSnapshots = lockRefs.length
      ? await Promise.all(lockRefs.map((lock) => transaction.get(lock.ref)))
      : [];
    if (lockSnapshots.some((snapshot) => snapshot.exists)) {
      throw Object.assign(new Error("O horário selecionado acabou de ficar indisponível."), { statusCode: 409 });
    }

    const booking = {
      codigoAgendamento: code,
      idempotencyKey,
      nome,
      email,
      telefone,
      servicos: plan.serviceNames,
      servico: plan.serviceNames.join(", "),
      categorias: plan.categories,
      profissionais: plan.professionals,
      valor: plan.value,
      data,
      horario,
      duracaoTotal: plan.duration,
      status: "confirmado",
      calendarStatus: "pendente",
      emailStatus: "pendente",
      criadoEm: FieldValue.serverTimestamp()
    };
    transaction.create(bookingRef, booking);
    lockRefs.forEach((lock) => transaction.create(lock.ref, {
      agendamentoId: bookingRef.id,
      codigoAgendamento: code,
      data,
      categoria: lock.category,
      horario: lock.slot,
      status: "confirmado",
      criadoEm: FieldValue.serverTimestamp()
    }));
    return { booking, existing: false, db, bookingRef };
  });
};

export const listAvailabilityForDate = async (date) => {
  if (!isValidDate(date)) throw Object.assign(new Error("Data inválida."), { statusCode: 400 });
  const db = getAdminDb();
  const snapshot = await db.collection("agendamentos").where("data", "==", date).get();
  return snapshot.docs
    .map((document) => document.data())
    .filter((booking) => booking.status !== "cancelado")
    .map((booking) => ({
      horario: booking.horario,
      duracaoTotal: Number(booking.duracaoTotal) || 60,
      categorias: categoriesForStoredBooking(booking),
      status: booking.status || "confirmado"
    }));
};

