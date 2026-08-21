import React from 'react';
import HeroSection from '../../components/HeroSection';
import ScrollProgress from '../../components/ScrollProgress';
import Courses from './Courses';
import { useTheme } from '../../context/ThemeContext';

const LearnMain = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen relative overflow-x-clip font-sans antialiased text-[#00113b] dark:text-[#8fd9ff] ${
      isDarkMode 
        ? "dark bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" 
        : "light bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
    }`}>
      <ScrollProgress />
      <HeroSection />
      <Courses />
    </div>
  );
};

export default LearnMain;
