// --- LÓGICA DOS CARROSSÉIS INDEPENDENTES (Ref: 99417.png) ---

document.addEventListener("DOMContentLoaded", () => {
  // Seleciona todos os blocos de categorias que possuem carrossel
  const categoryBlocks = document.querySelectorAll(".category-block");

  categoryBlocks.forEach((block) => {
    const track = block.querySelector(".carousel-track");
    const prevBtn = block.querySelector(".carousel-btn.prev");
    const nextBtn = block.querySelector(".carousel-btn.next");

    // Verifica se os elementos existem no bloco atual antes de configurar
    if (!track || !prevBtn || !nextBtn) return;

    // Define a largura do clique com base no tamanho de um card + o espaçamento (gap)
    // Isso garante que o carrossel pule de card em card perfeitamente
    const getScrollAmount = () => {
      const card = track.querySelector(".service-card");
      if (card) {
        return card.getBoundingClientRect().width + 20; // largura do card + 20px de gap
      }
      return 280; // Valor padrão de segurança
    };

    // Evento para o botão de Avançar (Direita)
    nextBtn.addEventListener("click", () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Evento para o botão de Voltar (Esquerda)
    prevBtn.addEventListener("click", () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: "smooth"
      });
    });

    // CONTROLE VISUAL OPCEONAL: Esconde as setas se o carrossel chegar ao limite
    // Dá um toque extra de refinamento de interface
    const toggleButtons = () => {
      const scrollLeft = track.scrollLeft;
      const maxScrollLeft = track.scrollWidth - track.clientWidth;

      // Se estiver no início, esconde o botão de voltar (opacidade menor ou invisível)
      if (scrollLeft <= 5) {
        prevBtn.style.opacity = "0.3";
        prevBtn.style.pointerEvents = "none";
      } else {
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
      }

      // Se chegar ao fim, esconde o botão de avançar
      if (scrollLeft >= maxScrollLeft - 5) {
        nextBtn.style.opacity = "0.3";
        nextBtn.style.pointerEvents = "none";
      } else {
        nextBtn.style.opacity = "1";
        nextBtn.style.pointerEvents = "auto";
      }
    };

    // Dispara a checagem das setas sempre que houver rolagem e no carregamento inicial
    track.addEventListener("scroll", toggleButtons);
    window.addEventListener("resize", toggleButtons);
    
    // Executa uma vez no início para ajustar os estados iniciais das setas
    setTimeout(toggleButtons, 300);
  });
});
