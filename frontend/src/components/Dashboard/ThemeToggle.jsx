import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`text-[15px] transition-colors duration-300 ${
        theme === 'dark' ? 'text-[#e0e6f5] hover:text-white' : 'text-[#00184f]'
      }`}
      aria-label="Toggle theme"
    >
      <FontAwesomeIcon icon={theme === 'light' ? 'moon' : 'sun'} />
    </button>
    
  );
};

export default ThemeToggle;