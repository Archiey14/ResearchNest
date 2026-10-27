import { useEffect } from "react";
import AppRouter from "./routes/AppRouter.jsx";

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("researchnest_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return <AppRouter />;
}
