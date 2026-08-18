import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CARD_STEP = 373.33 + 24;

function HomeCardSlider({ children }) {
  const viewportRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateButtons() {
    const el = viewportRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
  }

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    updateButtons();
    el.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);

    return () => {
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [children]);

  function scrollByCard(direction) {
    viewportRef.current?.scrollBy({
      left: direction * CARD_STEP,
      behavior: "smooth",
    });
  }

  return (
    <div className="home-slider">
      <button
        type="button"
        className="home-slider-btn home-slider-btn--prev"
        onClick={() => scrollByCard(-1)}
        disabled={!canPrev}
        aria-label="Xem trước"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="home-slider-viewport" ref={viewportRef}>
        <div className="home-slider-track">{children}</div>
      </div>

      <button
        type="button"
        className="home-slider-btn home-slider-btn--next"
        onClick={() => scrollByCard(1)}
        disabled={!canNext}
        aria-label="Xem tiếp"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

export default HomeCardSlider;
