// ==========================================================================
// LÓGICA INTELEGENTE DOS CARROSSÉIS INDEPENDENTES (Ref: image_dd0b5f.jpg)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Captura todos os blocos de categorias estruturados no HTML
  const categoryBlocks = document.querySelectorAll(".category-block");

  categoryBlocks.forEach((block) => {
    const track = block.querySelector(".carousel-track");
    const prevBtn = block.querySelector(".carousel-btn.prev");
    const nextBtn = block.querySelector(".carousel-btn.next");

    // Segurança: se o bloco não tiver a estrutura do carrossel, ignora
    if (!track || !prevBtn || !nextBtn) return;

    // Calcula dinamicamente a largura do card atual + o espaçamento (gap de 20px)
    // Isso garante que o carrossel pule exatamente de card em card no PC
    const getScrollAmount = () => {
      const card = track.querySelector(".service-card");
      if (card) {
        return card.getBoundingClientRect().width + 20; 
      }
      return 290; // Medida padrão de segurança
    };

    // Clique para avançar (Direita)
    nextBtn.addEventListener("click", () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Clique para voltar (Esquerda)
    prevBtn.addEventListener("click", () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: "smooth"
      });
    });

    // Gerenciador visual inteligente das setas flutuantes
    const toggleButtons = () => {
      const scrollLeft = track.scrollLeft;
      const maxScrollLeft = track.scrollWidth - track.clientWidth;

      // REFINAMENTO: Se a categoria não tiver itens suficientes para rolar,
      // esconde as duas setas completamente para o layout ficar limpo
      if (maxScrollLeft <= 10) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
      } else if (window.innerWidth > 768) {
        // Exibe em formato flex se voltar para o desktop e houver espaço de rolagem
        prevBtn.style.display = "flex";
        nextBtn.style.display = "flex";
      }

      // Controla a opacidade da seta esquerda (Voltar)
      if (scrollLeft <= 5) {
        prevBtn.style.opacity = "0.3";
        prevBtn.style.pointerEvents = "none"; // Desativa cliques desnecessários
      } else {
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
      }

      // Controla a opacidade da seta direita (Avançar)
      if (scrollLeft >= maxScrollLeft - 5) {
        nextBtn.style.opacity = "0.3";
        nextBtn.style.pointerEvents = "none";
      } else {
        nextBtn.style.opacity = "1";
        nextBtn.style.pointerEvents = "auto";
      }
    };

    // Monitora os eventos de rolagem por toque (mobile) ou redimensionamento de janela
    track.addEventListener("scroll", toggleButtons);
    window.addEventListener("resize", toggleButtons);
    
    // Executa uma checagem inicial logo após o carregamento da página
    setTimeout(toggleButtons, 300);
  });
});
