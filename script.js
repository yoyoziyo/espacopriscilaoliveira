// ==========================================================================
// LÓGICA DO WINDOW POPUP MODAL (Guia de Medidas de Cabelo P, M, G)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalMedidas");
  const openButtons = document.querySelectorAll(".btn-trigger-modal");
  const closeButton = document.querySelector(".btn-close-modal");

  // Abre o Modal de Medidas
  const openModal = () => {
    if (modal) {
      modal.classList.add("modal-active");
      document.body.style.overflow = "hidden"; // Bloqueia o scroll do fundo
    }
  };

  // Fecha o Modal de Medidas
  const closeModal = () => {
    if (modal) {
      modal.classList.remove("modal-active");
      document.body.style.overflow = ""; // Libera o scroll do fundo
    }
  };

  // Vincula o clique de abertura em todos os botões de guia de tamanho
  openButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // Fecha no botão "✕"
  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  // Fecha se clicar na cortina escura ao redor do modal
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Fecha ao apertar a tecla "Esc" do teclado
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("modal-active")) {
      closeModal();
    }
  });

  // ==========================================================================
  // LÓGICA INTELIGENTE DOS CARROSSÉIS INDEPENDENTES
  // ==========================================================================
  const categoryBlocks = document.querySelectorAll(".category-block");

  categoryBlocks.forEach((block) => {
    const track = block.querySelector(".carousel-track");
    const prevBtn = block.querySelector(".carousel-btn.prev");
    const nextBtn = block.querySelector(".carousel-btn.next");

    if (!track || !prevBtn || !nextBtn) return;

    // Calcula dinamicamente a largura do card + o gap de 20px
    const getScrollAmount = () => {
      const card = track.querySelector(".service-card");
      if (card) {
        return card.getBoundingClientRect().width + 20; 
      }
      return 290;
    };

    // Clique Avançar
    nextBtn.addEventListener("click", () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Clique Voltar
    prevBtn.addEventListener("click", () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Controle visual de opacidade e exibição das setas
    const toggleButtons = () => {
      const scrollLeft = track.scrollLeft;
      const maxScrollLeft = track.scrollWidth - track.clientWidth;

      if (maxScrollLeft <= 10) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
      } else if (window.innerWidth > 768) {
        prevBtn.style.display = "flex";
        nextBtn.style.display = "flex";
      }

      // Seta Esquerda (Voltar)
      if (scrollLeft <= 5) {
        prevBtn.style.opacity = "0.3";
        prevBtn.style.pointerEvents = "none";
      } else {
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
      }

      // Seta Direita (Avançar)
      if (scrollLeft >= maxScrollLeft - 5) {
        nextBtn.style.opacity = "0.3";
        nextBtn.style.pointerEvents = "none";
      } else {
        nextBtn.style.opacity = "1";
        nextBtn.style.pointerEvents = "auto";
      }
    };

    track.addEventListener("scroll", toggleButtons);
    window.addEventListener("resize", toggleButtons);
    setTimeout(toggleButtons, 300);
  });
});

// ==========================================================================
// BLOQUEIO ANTI-DOWNLOAD DE IMAGENS (Botão Direito)
// ==========================================================================
document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") {
    e.preventDefault();
  }
}, false);


// ==========================================================================
// FIREBASE E FLUXO DE AGENDAMENTO EM ETAPAS
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCfyg461i7D_L6eqk3EL-GHyf5L3tu5Dlw",
  authDomain: "espaco-priscila-oliveira.firebaseapp.com",
  projectId: "espaco-priscila-oliveira",
  storageBucket: "espaco-priscila-oliveira.firebasestorage.app",
  messagingSenderId: "59754778801",
  appId: "1:59754778801:web:53f6e2ded8cb0e6c051290"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const BOOKING_SLOT_INTERVAL = 30;
const DEFAULT_SERVICE_DURATION = 60;
const SERVICE_SCHEDULES = {
  hair: { label: "Cabelo", days: [2, 3, 4, 5, 6], openMinutes: 10 * 60, closeMinutes: 19 * 60 },
  nails: { label: "Unhas", days: [2, 3, 4, 5, 6], openMinutes: 10 * 60, closeMinutes: 19 * 60 },
  aesthetics: { label: "Sobrancelha/Estética", days: [1, 4], openMinutes: 13 * 60 + 30, closeMinutes: 19 * 60 },
  massage: { label: "Massagens", days: [], openMinutes: 0, closeMinutes: 0, comingSoon: true }
};

const bookingState = {
  currentStep: 1,
  selectedServices: new Map(),
  selectedDate: "",
  selectedTime: "",
  bookingsForDate: [],
  availabilityLoaded: false
};

const getCategoryKey = (categoryName) => {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("capilar")) return "hair";
  if (normalized.includes("unha")) return "nails";
  if (normalized.includes("massoterapia") || normalized.includes("massagem")) return "massage";
  if (normalized.includes("olhar") || normalized.includes("sobrancelha") || normalized.includes("estética")) return "aesthetics";
  return "hair";
};

const getSelectedSchedule = () => {
  const categoryKeys = [...new Set(
    [...bookingState.selectedServices.values()].map((service) => service.category)
  )];
  const activeRules = categoryKeys
    .map((category) => SERVICE_SCHEDULES[category])
    .filter((rule) => rule && !rule.comingSoon);

  if (!activeRules.length) return SERVICE_SCHEDULES.hair;

  return {
    days: activeRules.reduce(
      (allowedDays, rule) => allowedDays.filter((day) => rule.days.includes(day)),
      [...activeRules[0].days]
    ),
    openMinutes: Math.max(...activeRules.map((rule) => rule.openMinutes)),
    closeMinutes: Math.min(...activeRules.map((rule) => rule.closeMinutes)),
    categoryKeys
  };
};

const getScheduleMessage = () => {
  const categories = [...new Set(
    [...bookingState.selectedServices.values()].map((service) => service.category)
  )];
  const hasAesthetics = categories.includes("aesthetics");
  const hasHairOrNails = categories.some((category) => category === "hair" || category === "nails");

  if (hasAesthetics && hasHairOrNails) {
    return "Para combinar estes serviços, escolha uma quinta-feira entre 13:30 e 19:00.";
  }
  if (hasAesthetics) {
    return "Sobrancelha/Estética atende somente às segundas e quintas, das 13:30 às 19:00.";
  }
  return "Cabelo e Unhas atendem de terça-feira a sábado, das 10:00 às 19:00.";
};

const parseServiceDuration = (metaText) => {
  const normalized = metaText.toLowerCase();
  const hourMatch = normalized.match(/(\d+)h(?:\s*(\d+)\s*(?:min)?)?/);
  if (hourMatch) {
    return Number(hourMatch[1]) * 60 + Number(hourMatch[2] || 0);
  }

  const minuteMatch = normalized.match(/(\d+)\s*min/);
  return minuteMatch ? Number(minuteMatch[1]) : DEFAULT_SERVICE_DURATION;
};

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours}h`;
  return `${hours}h ${remainingMinutes}min`;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

const isBookingDayAllowed = (dateValue) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return false;
  const [year, month, day] = dateValue.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);
  return getSelectedSchedule().days.includes(selectedDate.getDay());
};

const isBookingTimeAllowed = (time) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const schedule = getSelectedSchedule();
  const minutes = timeToMinutes(time);
  return minutes >= schedule.openMinutes && minutes <= schedule.closeMinutes;
};

const getSelectedDuration = () => [...bookingState.selectedServices.values()]
  .reduce((total, service) => total + service.duration, 0);

const getSelectedServiceNames = () => [...bookingState.selectedServices.values()]
  .map((service) => service.name);

const getSelectedServiceValues = () => [...bookingState.selectedServices.values()]
  .map((service) => {
    const displayedPrice = service.meta.split("•")[0].trim() || "Valor sob consulta";
    return `${service.name}: ${displayedPrice}`;
  })
  .join(" | ");

const isSlotUnavailable = (slotMinutes) => {
  const selectedDuration = getSelectedDuration();
  if (!selectedDuration || !bookingState.availabilityLoaded) return true;
  if (slotMinutes + selectedDuration > getSelectedSchedule().closeMinutes) return true;

  return bookingState.bookingsForDate.some((booking) => {
    if (booking.status === "cancelado") return false;
    const bookingStart = timeToMinutes(booking.horario || "00:00");
    const bookingDuration = Number(booking.duracaoTotal) || DEFAULT_SERVICE_DURATION;
    const bookingEnd = bookingStart + bookingDuration;
    const candidateEnd = slotMinutes + selectedDuration;
    return slotMinutes < bookingEnd && candidateEnd > bookingStart;
  });
};

const updateStepButtons = () => {
  const stepOneNext = document.querySelector('[data-booking-step="1"] [data-next-step="2"]');
  const stepTwoNext = document.querySelector('[data-booking-step="2"] [data-next-step="3"]');
  if (stepOneNext) stepOneNext.disabled = bookingState.selectedServices.size === 0;
  if (stepTwoNext) stepTwoNext.disabled = !bookingState.selectedDate || !bookingState.selectedTime;
};

const updateServiceSummary = () => {
  const countElement = document.getElementById("bookingServiceCount");
  const durationElement = document.getElementById("bookingTotalDuration");
  const count = bookingState.selectedServices.size;
  const duration = getSelectedDuration();

  if (countElement) {
    countElement.textContent = count
      ? `${count} ${count === 1 ? "serviço selecionado" : "serviços selecionados"}`
      : "Nenhum serviço selecionado";
  }
  if (durationElement) {
    durationElement.textContent = `Duração estimada: ${formatDuration(duration)}`;
  }

  if (bookingState.selectedDate && !isBookingDayAllowed(bookingState.selectedDate)) {
    bookingState.selectedDate = "";
    bookingState.selectedTime = "";
    bookingState.bookingsForDate = [];
    bookingState.availabilityLoaded = false;
    const dateInput = document.getElementById("bookingDate");
    const status = document.getElementById("bookingAvailabilityStatus");
    if (dateInput) dateInput.value = "";
    if (status) status.textContent = getScheduleMessage();
  }

  if (bookingState.selectedTime && (
    !isBookingTimeAllowed(bookingState.selectedTime)
    || isSlotUnavailable(timeToMinutes(bookingState.selectedTime))
  )) {
    bookingState.selectedTime = "";
    const hiddenTime = document.getElementById("bookingTime");
    if (hiddenTime) hiddenTime.value = "";
  }

  renderTimeSlots();
  updateStepButtons();
};

const renderServiceOptions = () => {
  const grid = document.getElementById("bookingServicesGrid");
  if (!grid) return;

  const services = [...document.querySelectorAll(".service-card")].map((card, index) => {
    const categoryName = card.closest(".category-block")?.querySelector(".category-text h3")?.childNodes[0]?.textContent.trim() || "";
    const category = getCategoryKey(categoryName);
    const name = card.querySelector("h4")?.textContent.trim();
    const meta = card.querySelector(".service-meta")?.textContent.trim() || "";
    return {
      id: `service-${index}`,
      name,
      meta,
      category,
      comingSoon: SERVICE_SCHEDULES[category]?.comingSoon === true,
      duration: parseServiceDuration(meta)
    };
  }).filter((service) => service.name);

  services.forEach((service) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "booking-service-card";
    button.dataset.serviceId = service.id;
    button.setAttribute("aria-pressed", "false");

    const title = document.createElement("strong");
    title.textContent = service.name;
    const meta = document.createElement("span");
    meta.textContent = service.meta || "Valor sob consulta";
    const duration = document.createElement("small");
    duration.textContent = service.comingSoon
      ? "Em breve"
      : `Duração estimada: ${formatDuration(service.duration)}`;
    if (service.comingSoon) {
      button.disabled = true;
      button.classList.add("is-coming-soon");
      button.setAttribute("aria-disabled", "true");
      button.title = "Massagens estarão disponíveis em breve.";
    }
    const check = document.createElement("span");
    check.className = "booking-service-check";
    check.textContent = "✓";
    check.setAttribute("aria-hidden", "true");

    button.append(title, meta, duration, check);
    button.addEventListener("click", () => {
      if (service.comingSoon) return;
      if (bookingState.selectedServices.has(service.id)) {
        bookingState.selectedServices.delete(service.id);
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      } else {
        bookingState.selectedServices.set(service.id, service);
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      }
      updateServiceSummary();
    });
    grid.appendChild(button);
  });
};

const renderTimeSlots = () => {
  const grid = document.getElementById("bookingTimeGrid");
  if (!grid) return;
  grid.replaceChildren();

  const schedule = getSelectedSchedule();
  for (let minutes = schedule.openMinutes; minutes <= schedule.closeMinutes; minutes += BOOKING_SLOT_INTERVAL) {
    const time = minutesToTime(minutes);
    const button = document.createElement("button");
    const unavailable = !bookingState.selectedDate || isSlotUnavailable(minutes);

    button.type = "button";
    button.className = "booking-time-button";
    button.textContent = time;
    button.dataset.time = time;
    button.disabled = unavailable;
    button.setAttribute("aria-pressed", String(bookingState.selectedTime === time));

    if (bookingState.selectedTime === time) button.classList.add("is-selected");
    if (unavailable) button.classList.add("is-unavailable");

    button.addEventListener("click", () => {
      if (button.disabled) return;
      bookingState.selectedTime = time;
      document.getElementById("bookingTime").value = time;
      grid.querySelectorAll(".booking-time-button").forEach((slot) => {
        const isSelected = slot.dataset.time === time;
        slot.classList.toggle("is-selected", isSelected);
        slot.setAttribute("aria-pressed", String(isSelected));
      });
      updateStepButtons();
    });

    grid.appendChild(button);
  }
};

const loadBookingsForDate = async (date) => {
  const status = document.getElementById("bookingAvailabilityStatus");
  bookingState.selectedDate = isBookingDayAllowed(date) ? date : "";
  bookingState.selectedTime = "";
  bookingState.bookingsForDate = [];
  bookingState.availabilityLoaded = false;
  document.getElementById("bookingTime").value = "";
  updateStepButtons();
  renderTimeSlots();

  if (!date) {
    if (status) status.textContent = "Escolha uma data para consultar.";
    return;
  }

  if (!isBookingDayAllowed(date)) {
    if (status) status.textContent = getScheduleMessage();
    return;
  }

  if (status) status.textContent = "Consultando disponibilidade...";

  try {
    const snapshot = await db.collection("agendamentos").where("data", "==", date).get();
    bookingState.bookingsForDate = snapshot.docs.map((documentSnapshot) => documentSnapshot.data());
    bookingState.availabilityLoaded = true;
    if (status) status.textContent = "Disponibilidade atualizada.";
  } catch (error) {
    console.error("Erro ao consultar horários:", error);
    if (status) status.textContent = "Não foi possível consultar os horários. Tente novamente.";
  }

  renderTimeSlots();
};

const goToBookingStep = (step) => {
  bookingState.currentStep = step;

  document.querySelectorAll("[data-booking-step]").forEach((panel) => {
    const active = Number(panel.dataset.bookingStep) === step;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });

  document.querySelectorAll("[data-progress-step]").forEach((item) => {
    const itemStep = Number(item.dataset.progressStep);
    item.classList.toggle("is-active", itemStep === step);
    item.classList.toggle("is-complete", itemStep < step);
  });

  if (step === 3) renderBookingReview();
  document.getElementById("agendamento")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const renderBookingReview = () => {
  const review = document.getElementById("bookingReview");
  if (!review) return;

  const services = getSelectedServiceNames();
  const formattedDate = bookingState.selectedDate.split("-").reverse().join("/");
  review.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = "Resumo da solicitação";
  const serviceText = document.createElement("p");
  serviceText.textContent = services.join(", ");
  const scheduleText = document.createElement("p");
  scheduleText.textContent = `${formattedDate} às ${bookingState.selectedTime} • ${formatDuration(getSelectedDuration())}`;
  review.append(title, serviceText, scheduleText);
};

const formatGoogleCalendarDate = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("") + "T" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00"
  ].join("");
};

const buildGoogleCalendarUrl = ({ nome, servicos, data, horario, duracaoTotal }) => {
  const startDate = new Date(`${data}T${horario}:00`);
  const endDate = new Date(startDate.getTime() + duracaoTotal * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Agendamento - ${servicos.join(", ")}`,
    dates: `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`,
    details: `Solicitação de agendamento de ${nome}. Serviços: ${servicos.join(", ")}. Aguarde a confirmação pelo WhatsApp.`,
    location: "Pç. Heitor Bastos Tigre, 16355 - Recreio dos Bandeirantes, Rio de Janeiro - RJ, 22790-550",
    ctz: "America/Sao_Paulo"
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const showBookingConfirmation = ({ calendarUrl, whatsappUrl }) => {
  const confirmation = document.getElementById("bookingConfirmation");
  if (!confirmation) return;

  const message = document.createElement("p");
  message.textContent = "Solicitação salva! Confirme os detalhes com a Priscila pelo WhatsApp.";

  const calendarButton = document.createElement("a");
  calendarButton.className = "btn-google-calendar";
  calendarButton.href = calendarUrl;
  calendarButton.target = "_blank";
  calendarButton.rel = "noopener noreferrer";
  calendarButton.textContent = "📅 Adicionar ao meu Google Agenda";

  const whatsappFallback = document.createElement("a");
  whatsappFallback.className = "booking-whatsapp-fallback";
  whatsappFallback.href = whatsappUrl;
  whatsappFallback.target = "_blank";
  whatsappFallback.rel = "noopener noreferrer";
  whatsappFallback.textContent = "Abrir conversa no WhatsApp";

  confirmation.replaceChildren(message, calendarButton, whatsappFallback);
  confirmation.hidden = false;
};

async function handleBookingSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector(".btn-booking-submit");
  const statusElement = document.getElementById("bookingStatus");
  const confirmation = document.getElementById("bookingConfirmation");
  const nome = document.getElementById("bookingName").value.trim();
  const email = document.getElementById("bookingEmail").value.trim();
  const telefone = document.getElementById("bookingPhone").value.trim();
  const servicos = getSelectedServiceNames();
  const valor = getSelectedServiceValues();
  const data = bookingState.selectedDate;
  const horario = bookingState.selectedTime;
  const duracaoTotal = getSelectedDuration();

  if (!nome || !email || !telefone || !servicos.length || !data || !horario) {
    statusElement.textContent = "Revise as etapas e preencha todos os dados.";
    return;
  }

  if (!isBookingDayAllowed(data) || !isBookingTimeAllowed(horario)) {
    statusElement.textContent = getScheduleMessage();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Verificando...";
  statusElement.textContent = "";
  confirmation.hidden = true;

  try {
    await loadBookingsForDate(data);
    const requestedMinutes = timeToMinutes(horario);
    if (isSlotUnavailable(requestedMinutes)) {
      throw new Error("O horário selecionado acabou de ficar indisponível.");
    }

    bookingState.selectedTime = horario;
    document.getElementById("bookingTime").value = horario;
    submitButton.textContent = "Salvando...";

    await db.collection("agendamentos").add({
      nome,
      email,
      telefone,
      servicos,
      servico: servicos.join(", "),
      valor,
      data,
      horario,
      duracaoTotal,
      status: "pendente",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    try {
      const calendarResponse = await fetch("https://espacopriscilaoliveira.vercel.app/api/agendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          servico: servicos.join(", "),
          valor,
          data,
          horario,
          duracaoTotal
        })
      });

      const calendarResult = await calendarResponse.json().catch(() => ({}));
      if (!calendarResponse.ok || !calendarResult.success) {
        throw new Error(calendarResult.error || "Falha ao sincronizar com o Google Calendar.");
      }
    } catch (calendarError) {
      console.error("Agendamento salvo, mas o calendário não foi sincronizado:", calendarError);
      statusElement.textContent = "Agendamento salvo, mas não foi possível sincronizar automaticamente com a agenda. Avise a Priscila pelo WhatsApp.";
    }

    const calendarUrl = buildGoogleCalendarUrl({ nome, servicos, data, horario, duracaoTotal });
    const formattedDate = data.split("-").reverse().join("/");
    const whatsappMessage = [
      "Olá, Priscila! Gostaria de confirmar uma solicitação de agendamento:",
      "",
      `Nome: ${nome}`,
      `E-mail: ${email}`,
      `Telefone/WhatsApp: ${telefone}`,
      `Serviços: ${servicos.join(", ")}`,
      `Duração estimada: ${formatDuration(duracaoTotal)}`,
      `Data: ${formattedDate}`,
      `Horário: ${horario}`,
      "",
      "Aguardo a confirmação. Obrigada!"
    ].join("\n");
    const whatsappUrl = `https://wa.me/5521982490919?text=${encodeURIComponent(whatsappMessage)}`;

    showBookingConfirmation({ calendarUrl, whatsappUrl });
    const whatsappWindow = window.open(whatsappUrl, "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;
    else statusElement.textContent = "O navegador bloqueou a nova aba. Use o link de WhatsApp abaixo.";

    bookingState.bookingsForDate.push({ data, horario, duracaoTotal, status: "pendente" });
    renderTimeSlots();
  } catch (error) {
    console.error("Erro ao concluir agendamento:", error);
    statusElement.textContent = error.message.includes("indisponível")
      ? error.message
      : "Não foi possível concluir o agendamento. Tente novamente em instantes.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Solicitar agendamento";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  const dateInput = document.getElementById("bookingDate");

  renderServiceOptions();
  renderTimeSlots();
  updateServiceSummary();

  if (dateInput) {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    dateInput.min = new Date(today.getTime() - timezoneOffset).toISOString().split("T")[0];
    dateInput.addEventListener("change", () => {
      dateInput.setCustomValidity("");
      if (dateInput.value && !isBookingDayAllowed(dateInput.value)) {
        dateInput.setCustomValidity(getScheduleMessage());
        dateInput.reportValidity();
        dateInput.value = "";
      }
      loadBookingsForDate(dateInput.value);
    });
  }

  document.querySelectorAll("[data-next-step]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.disabled) goToBookingStep(Number(button.dataset.nextStep));
    });
  });

  document.querySelectorAll("[data-back-step]").forEach((button) => {
    button.addEventListener("click", () => goToBookingStep(Number(button.dataset.backStep)));
  });

  if (form) form.addEventListener("submit", handleBookingSubmit);
});
