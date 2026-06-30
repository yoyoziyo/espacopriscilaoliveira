document.addEventListener("DOMContentLoaded", () => {
  
  /* ==========================================================================
     1. LÓGICA DO WINDOW POPUP MODAL (Guia de Medidas de Cabelo P, M, G)
     ========================================================================== */
  const modal = document.getElementById("modalMedidas");
  const openButtons = document.querySelectorAll(".btn-trigger-modal");
  const closeButton = document.querySelector(".btn-close-modal");

  // Função para abrir o Modal
  const openModal = () => {
    if (modal) {
      modal.classList.add("modal-active");
      document.body.style.overflow = "hidden"; // Trava o scroll do fundo
    }
  };

  // Função para fechar o Modal
  const closeModal = () => {
    if (modal) {
      modal.classList.remove("modal-active");
      document.body.style.overflow = ""; // Libera o scroll do fundo
    }
  };

  // Atribui evento de abertura para todos os botões "Ver Guia de Tamanhos"
  openButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // Evento para fechar no botão de "X"
  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  // Evento para fechar se clicar na cortina escura de fundo
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Evento para fechar se pressionar a tecla ESC no teclado
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("modal-active")) {
      closeModal();
    }
  });


  /* ==========================================================================
     2. LÓGICA DOS CARROSSÉIS DE SERVIÇOS (Rolagem via Botões)
     ========================================================================== */
  const carousels = document.querySelectorAll(".category-block");

  carousels.forEach(block => {
    const track = block.querySelector(".carousel-track");
    const prevBtn = block.querySelector(".carousel-btn.prev");
    const nextBtn = block.querySelector(".carousel-btn.next");

    if (!track || !prevBtn || !nextBtn) return;

    // Calcula a largura de rolagem baseada no tamanho de um card
    const getScrollAmount = () => {
      const card = track.querySelector(".service-card");
      return card ? card.offsetWidth + 24 : 324; // 24px é o gap definido no CSS
    };

    // Botão Avançar
    nextBtn.addEventListener("click", () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Botão Voltar
    prevBtn.addEventListener("click", () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Opcional: Oculta botões se o conteúdo não transbordar (computadores grandes)
    const toggleButtons = () => {
      if (track.scrollWidth <= track.clientWidth) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      } else {
        prevBtn.style.display = "";
        nextBtn.style.display = "";
      }
    };

    // Executa e monitora redimensionamento da tela
    toggleButtons();
    window.addEventListener("resize", toggleButtons);
  });

});
