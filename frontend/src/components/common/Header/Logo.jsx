import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="MediUTE - Trang chủ">
      <img src="/favicon.svg" alt="" aria-hidden="true" />
      <span>MediUTE</span>
    </Link>
  );
}

export default Logo;
