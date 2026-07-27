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
// FIREBASE E FORMULÁRIO DE AGENDAMENTO
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

const buildGoogleCalendarUrl = ({ nome, servico, data, horario }) => {
  const startDate = new Date(`${data}T${horario}:00`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Agendamento - ${servico}`,
    dates: `${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}`,
    details: `Solicitação de agendamento de ${nome} para ${servico}. Aguarde a confirmação pelo WhatsApp.`,
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
  const servico = document.getElementById("bookingService").value;
  const data = document.getElementById("bookingDate").value;
  const horario = document.getElementById("bookingTime").value;

  if (!nome || !servico || !data || !horario) {
    statusElement.textContent = "Preencha todos os campos para continuar.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Salvando...";
  statusElement.textContent = "";
  confirmation.hidden = true;

  try {
    await db.collection("agendamentos").add({
      nome,
      servico,
      data,
      horario,
      status: "pendente",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    const calendarUrl = buildGoogleCalendarUrl({ nome, servico, data, horario });
    const formattedDate = data.split("-").reverse().join("/");
    const whatsappMessage = [
      "Olá, Priscila! Gostaria de confirmar uma solicitação de agendamento:",
      "",
      `Nome: ${nome}`,
      `Serviço: ${servico}`,
      `Data: ${formattedDate}`,
      `Horário: ${horario}`,
      "",
      "Aguardo a confirmação. Obrigada!"
    ].join("\n");
    const whatsappUrl = `https://wa.me/5521982490919?text=${encodeURIComponent(whatsappMessage)}`;

    showBookingConfirmation({ calendarUrl, whatsappUrl });
    form.reset();

    const whatsappWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!whatsappWindow) {
      statusElement.textContent = "O navegador bloqueou a nova aba. Use o link de WhatsApp exibido abaixo.";
    }
  } catch (error) {
    console.error("Erro ao salvar agendamento:", error);
    statusElement.textContent = "Não foi possível salvar o agendamento. Tente novamente em instantes.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Solicitar agendamento";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bookingForm");
  const serviceSelect = document.getElementById("bookingService");
  const dateInput = document.getElementById("bookingDate");

  if (serviceSelect) {
    const serviceNames = [...document.querySelectorAll(".service-card h4")]
      .map((heading) => heading.textContent.trim())
      .filter((name, index, names) => name && names.indexOf(name) === index);

    serviceNames.forEach((serviceName) => {
      const option = document.createElement("option");
      option.value = serviceName;
      option.textContent = serviceName;
      serviceSelect.appendChild(option);
    });
  }

  if (dateInput) {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    dateInput.min = new Date(today.getTime() - timezoneOffset).toISOString().split("T")[0];
  }

  if (form) {
    form.addEventListener("submit", handleBookingSubmit);
  }
});
