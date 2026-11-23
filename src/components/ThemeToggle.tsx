import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [light, setLight] = useState(() => {
    try { return localStorage.getItem('texmaquina-theme') === 'light'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    try { localStorage.setItem('texmaquina-theme', light ? 'light' : 'dark'); } catch {}
  }, [light]);

  return (
    <button
      type="button"
      onClick={() => setLight((value) => !value)}
      className="theme-toggle p-2 rounded-xl border transition-colors"
      aria-label={light ? 'Ativar tema escuro' : 'Ativar tema claro'}
      title={light ? 'Tema escuro' : 'Tema claro'}
    >
      {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
};
