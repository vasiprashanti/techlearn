import React, { useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import Navbar from '../../components/Navbar'
import ScrollProgress from '../../components/ScrollProgress'
import InternShowcase from '../../components/InternShowcase'

const About = () => {
  const { theme } = useTheme()

  useEffect(() => {
    // Services animation logic
    const logoBoxes = document.querySelectorAll(".about-service-box")

    function cycleText(box) {
      const texts = box.querySelectorAll("span")
      let currentIndex = 0

      function changeText() {
        texts[currentIndex].classList.add("fall")
        setTimeout(() => {
          texts[currentIndex].classList.remove("active", "fall")
          currentIndex = (currentIndex + 1) % texts.length
          texts[currentIndex].classList.add("active")

          setTimeout(changeText, Math.random() * 3000 + 2000)
        }, 600)
      }

      setTimeout(changeText, Math.random() * 2000)
    }

    logoBoxes.forEach(box => cycleText(box))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
      <ScrollProgress />
      <Navbar />
      
      {/* Section 1: Mission and Vision */}
      <div className="mission-vision-section py-12 pt-32 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[#011c56] dark:text-white mb-8">
            ABOUT TECHLEARN
          </h1>
          <h3 className="text-xl md:text-2xl font-light text-[#1946a4] dark:text-blue-300 mb-16">
            Empowering the Next Generation of Tech Innovators
          </h3>
          
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            {/* Mission */}
            <div className="mission-card bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold text-[#011c56] dark:text-white mb-4">Our Mission</h3>
              <p className="text-[#1946a4] dark:text-blue-300 text-lg leading-relaxed">
                To democratize technology education by providing accessible, practical, and industry-relevant learning experiences that transform beginners into confident developers and innovators.
              </p>
            </div>
            
            {/* Vision */}
            <div className="vision-card bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-5xl mb-6">🚀</div>
              <h3 className="text-2xl font-bold text-[#011c56] dark:text-white mb-4">Our Vision</h3>
              <p className="text-[#1946a4] dark:text-blue-300 text-lg leading-relaxed">
                To be the leading platform where aspiring technologists discover their potential, master cutting-edge skills, and build solutions that shape the future of technology.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Meet the Summer Interns 25' */}
      <InternShowcase />

      {/* Section 3: What We Offer */}
      <div className="offerings-section py-16 bg-white/10 dark:bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#011c56] dark:text-white mb-4">
            WHAT WE OFFER
          </h2>
          <h3 className="text-xl font-light text-[#1946a4] dark:text-blue-300 mb-16">
            Comprehensive Learning Ecosystem
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Interactive Courses */}
            <div className="offering-card bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">📚</div>
              <h4 className="text-xl font-semibold text-[#011c56] dark:text-white mb-3">Interactive Courses</h4>
              <p className="text-[#1946a4] dark:text-blue-300">
                Comprehensive programming courses with hands-on projects, real-world applications, and personalized learning paths.
              </p>
            </div>
            
            {/* Certificates */}
            <div className="offering-card bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">🏆</div>
              <h4 className="text-xl font-semibold text-[#011c56] dark:text-white mb-3">Industry Certificates</h4>
              <p className="text-[#1946a4] dark:text-blue-300">
                Earn recognized certifications that validate your skills and boost your career prospects in the tech industry.
              </p>
            </div>
            
            {/* Quizzes & Assessments */}
            <div className="offering-card bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">🧠</div>
              <h4 className="text-xl font-semibold text-[#011c56] dark:text-white mb-3">Smart Assessments</h4>
              <p className="text-[#1946a4] dark:text-blue-300">
                Interactive quizzes and coding challenges that test your knowledge and track your progress effectively.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Build Tasks */}
            <div className="offering-card bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">🛠️</div>
              <h4 className="text-xl font-semibold text-[#011c56] dark:text-white mb-3">Hands-on Projects</h4>
              <p className="text-[#1946a4] dark:text-blue-300">
                Build real-world applications from mini projects to major developments, creating a portfolio that showcases your abilities.
              </p>
            </div>
            
            {/* Live Learning */}
            <div className="offering-card bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:scale-105 transition-all duration-300">
              <div className="text-4xl mb-4">🎥</div>
              <h4 className="text-xl font-semibold text-[#011c56] dark:text-white mb-3">Live Sessions</h4>
              <p className="text-[#1946a4] dark:text-blue-300">
                Interactive live classes, mentorship sessions, and community support to accelerate your learning journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Our Services */}
      <div className="services-section py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#011c56] dark:text-white mb-4">
            OUR SERVICES
          </h2>
          <h3 className="text-xl font-light text-[#1946a4] dark:text-blue-300 mb-16">
            Your Vision, Our Action
          </h3>
          
          <div className="about-services-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Service boxes with rotating text */}
            <div className="about-service-box">
              <span className="active">Web Development</span>
              <span>App Development</span>
              <span>Digital Marketing</span>
            </div>
            <div className="about-service-box">
              <span className="active">Branding</span>
              <span>UI/UX Design</span>
              <span>Content Creation</span>
            </div>
            <div className="about-service-box">
              <span className="active">Final Year Projects</span>
              <span>Corporate Training</span>
              <span>Placement Training</span>
            </div>
            <div className="about-service-box">
              <span className="active">App Development</span>
              <span>Web Development</span>
              <span>Branding</span>
            </div>
            <div className="about-service-box">
              <span className="active">Content Creation</span>
              <span>Digital Marketing</span>
              <span>Corporate Training</span>
            </div>
            <div className="about-service-box">
              <span className="active">Final Year Projects</span>
              <span>Web Development</span>
              <span>Placement Training</span>
            </div>
            <div className="about-service-box">
              <span className="active">UI/UX Design</span>
              <span>Branding</span>
              <span>App Development</span>
            </div>
            <div className="about-service-box">
              <span className="active">Digital Marketing</span>
              <span>Content Creation</span>
              <span>College Projects</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
