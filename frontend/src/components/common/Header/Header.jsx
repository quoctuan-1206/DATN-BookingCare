import "./Header.css";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Navigation from "./Navigation";
import Actions from "./Actions";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    const closeOnDesktop = window.matchMedia("(min-width: 1101px)");
    const handleDesktopChange = (event) => {
      if (event.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    closeOnDesktop.addEventListener("change", handleDesktopChange);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      closeOnDesktop.removeEventListener("change", handleDesktopChange);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header-container">
        <Logo />
        <div id="primary-navigation" className={`header-content${menuOpen ? " is-open" : ""}`}>
          <Navigation onNavigate={closeMenu} />
          <Actions onNavigate={closeMenu} />
        </div>
        <button
          ref={menuToggleRef}
          type="button"
          className="header-menu-toggle"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

export default Header;
