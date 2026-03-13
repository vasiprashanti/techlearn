import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center border border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      <div className={`w-2 h-2 rounded-full transition-all duration-500 ${theme === 'dark' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-black'}`} />
    </button>
  );
};

export default ThemeToggle;