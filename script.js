// ==========================================================================
// INTERAÇÃO DOS CARROSSÉIS PREMIUM (Ref: 99417.png)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Captura todos os blocos de categorias estruturados no HTML
  const categoryBlocks = document.querySelectorAll(".category-block");

  categoryBlocks.forEach((block) => {
    const track = block.querySelector(".carousel-track");
    const prevBtn = block.querySelector(".carousel-btn.prev");
    const nextBtn = block.querySelector(".carousel-btn.next");

    // Validação de segurança: ignora o bloco se algum elemento estiver faltando
    if (!track || !prevBtn || !nextBtn) return;

    /**
     * Calcula dinamicamente o espaço exato de rolagem.
     * Pega a largura atual de um card de serviço e soma o espaçamento (gap) de 20px.
     */
    const getScrollAmount = () => {
      const card = track.querySelector(".service-card");
      if (card) {
        return card.getBoundingClientRect().width + 20; 
      }
      return 285; // Fallback de segurança caso o card não seja detectado imediatamente
    };

    // Evento de clique para avançar (Direita)
    nextBtn.addEventListener("click", () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Evento de clique para voltar (Esquerda)
    prevBtn.addEventListener("click", () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: "smooth"
      });
    });

    /**
     * Controla a visibilidade e interatividade das setas de navegação.
     * Esconde ou suaviza as setas quando o usuário atinge os limites de rolagem.
     */
    const updateButtonStates = () => {
      const scrollLeft = track.scrollLeft;
      const maxScrollLeft = track.scrollWidth - track.clientWidth;

      // Gerenciamento da Seta Esquerda (Voltar)
      if (scrollLeft <= 4) {
        prevBtn.style.opacity = "0.2";
        prevBtn.style.pointerEvents = "none";
      } else {
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
      }

      // Gerenciamento da Seta Direita (Avançar)
      if (scrollLeft >= maxScrollLeft - 4) {
        nextBtn.style.opacity = "0.2";
        nextBtn.style.pointerEvents = "none";
      } else {
        nextBtn.style.opacity = "1";
        nextBtn.style.pointerEvents = "auto";
      }
    };

    // Ouvintes de eventos para monitorar a rolagem em tempo real e redimensionamentos de tela
    track.addEventListener("scroll", updateButtonStates);
    window.addEventListener("resize", updateButtonStates);
    
    // Execução inicial com um pequeno delay para garantir a renderização completa do layout
    setTimeout(updateButtonStates, 300);
  });
});
