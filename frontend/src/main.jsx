import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
// Dashboard layout layer (full-width app shell, joined KPI strip, flat panels).
import "./styles/dashboard.css";
// Must stay LAST: patches responsive gaps in global/admin/chatbot/pdfReader/legal css.
import "./styles/responsive.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
