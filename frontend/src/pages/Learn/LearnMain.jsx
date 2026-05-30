import React from 'react';
import HeroSection from '../../components/HeroSection';
import ScrollProgress from '../../components/ScrollProgress';
import Courses from './Courses';
import { useTheme } from '../../context/ThemeContext';

const LearnMain = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans antialiased text-[#0d2a57] dark:text-[#8fd9ff] ${
      isDarkMode 
        ? "dark bg-[#020816]" 
        : "light bg-gradient-to-br from-[#bceaff] via-[#9adfff] to-[#bceaff]"
    }`}>
      <ScrollProgress />
      <HeroSection />
      <Courses />
    </div>
  );
};

export default LearnMain;
