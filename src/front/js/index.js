// Import React y ReactDOM
import React from "react";
import { createRoot } from "react-dom/client"; // Importa createRoot

// Importa tu archivo de estilos
import "../styles/index.css";

// Importa tu componente principal
import Layout from "./layout";

// Obtén el elemento donde se montará la aplicación
const rootElement = document.querySelector("#app");

// Usa createRoot para inicializar el renderizado
const root = createRoot(rootElement);

// Renderiza la aplicación
root.render(<Layout />);

