import { MoonStar, Sparkles, SunMedium } from "lucide-react";
import { useTheme } from "../../app/ThemeContext.jsx";

export default function ThemeToggleButton({ compact = false, className = "" }) {
  const { isDark, theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "theme-toggle--compact" : ""} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Alternar para modo ${isDark ? "claro" : "escuro"}`}
      title={`Modo atual: ${theme}`}
    >
      <span className="theme-toggle__icon">
        {isDark ? <MoonStar size={17} /> : <SunMedium size={17} />}
      </span>
      {!compact ? (
        <span className="theme-toggle__label">
          <span className="theme-toggle__eyebrow">
            {"\u2728"} visual
          </span>
          <strong>{isDark ? "Noite divertida" : "Dia vibrante"}</strong>
        </span>
      ) : null}
      {!compact ? <Sparkles size={15} className="theme-toggle__spark" /> : null}
    </button>
  );
}
