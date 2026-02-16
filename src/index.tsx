import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Mencari elemen ID 'root' di index.html
const rootElement = document.getElementById("root");

// Guard clause untuk memastikan element root ada sebelum mounting
if (!rootElement) {
  throw new Error(
    "Gagal menemukan elemen root untuk melakukan mounting aplikasi Pasarqu.",
  );
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* Mengarahkan ke App.tsx yang sudah kita update dengan Branding Area & Logo Paten */}
    <App />
  </React.StrictMode>,
);
