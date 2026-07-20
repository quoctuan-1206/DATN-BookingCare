import "./Header.css";

import Logo from "./Logo";
import Navigation from "./Navigation";
import Actions from "./Actions";

function Header() {
  return (
    <header className="header">
      <div className="container">
        <Logo />
        <Navigation />
        <Actions />
      </div>
    </header>
  );
}

export default Header;
