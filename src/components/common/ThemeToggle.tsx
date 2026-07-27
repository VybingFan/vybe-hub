import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "dark" | "light";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(window.localStorage.getItem("vybe:theme") === "light" ? "light" : "dark");
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("vybe:theme", nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
  }

  const nextLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className={showLabel ? "w-full justify-start" : "rounded-full"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel ? (
        <span className="ml-2">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      ) : null}
    </Button>
  );
}
