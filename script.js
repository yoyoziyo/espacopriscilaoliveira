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
