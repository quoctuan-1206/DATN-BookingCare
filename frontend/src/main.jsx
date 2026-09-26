import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
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
import "./styles/article.css";
import "./styles/listing.css";
import "./styles/booking.css";
import "./styles/patient.css";
import "./styles/auth.css";
import "./styles/admin.css";
import "./styles/doctor-dashboard.css";
import "./styles/lab.css";
import "./styles/clinical.css";
import "./styles/mock-vnpay.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
