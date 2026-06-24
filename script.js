// --- LÓGICA DOS CARROSSÉIS INDEPENDENTES ---

document.addEventListener("DOMContentLoaded", () => {
  const categoryBlocks = document.querySelectorAll(".category-block");

  categoryBlocks.forEach((block) => {
    const track = block.querySelector(".carousel-track");
    const prevBtn = block.querySelector(".carousel-btn.prev");
    const nextBtn = block.querySelector(".carousel-btn.next");

    if (!track || !prevBtn || !nextBtn) return;

    const getScrollAmount = () => {
      const card = track.querySelector(".service-card");
      if (card) {
        return card.getBoundingClientRect().width + 20; 
      }
      return 290; 
    };

    nextBtn.addEventListener("click", () => {
      track.scrollBy({
        left: getScrollAmount(),
        behavior: "smooth"
      });
    });

    prevBtn.addEventListener("click", () => {
      track.scrollBy({
        left: -getScrollAmount(),
        behavior: "smooth"
      });
    });

    const toggleButtons = () => {
      const scrollLeft = track.scrollLeft;
      const maxScrollLeft = track.scrollWidth - track.clientWidth;

      // Se a lista não tiver rolagem (ex: poucos cards), esconde as duas setas no desktop
      if (maxScrollLeft <= 10) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
      } else if (window.innerWidth > 768) {
        prevBtn.style.display = "flex";
        nextBtn.style.display = "flex";
      }

      if (scrollLeft <= 5) {
        prevBtn.style.opacity = "0.3";
        prevBtn.style.pointerEvents = "none";
      } else {
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
      }

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
