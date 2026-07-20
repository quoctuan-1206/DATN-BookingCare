import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/section.css";
import "./styles/card.css";
import "./styles/button.css";
import "./styles/form.css";
import "./styles/doctor.css";
import "./styles/clinic.css";
import "./styles/specialty.css";
import "./styles/listing.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
