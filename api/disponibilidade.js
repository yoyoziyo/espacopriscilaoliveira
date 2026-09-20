import { listAvailabilityForDate } from "./_booking.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Método não permitido." });

  try {
    const agendamentos = await listAvailabilityForDate(String(req.query?.data || ""));
    return res.status(200).json({ success: true, agendamentos });
  } catch (error) {
    console.error("Falha ao consultar disponibilidade:", error?.message || error);
    return res.status(error?.statusCode || 500).json({
      success: false,
      error: error?.statusCode ? error.message : "Não foi possível consultar a disponibilidade."
    });
  }
}

