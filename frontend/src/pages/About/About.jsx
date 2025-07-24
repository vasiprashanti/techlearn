import React, { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import Navbar from '../../components/Navbar'
import ScrollProgress from '../../components/ScrollProgress'
import InternShowcase from '../../components/InternShowcase'

const About = () => {
  const { theme } = useTheme()
  const [scrollY, setScrollY] = useState(0)

  // Letter animation functions
  const wrapLetters = (elementId) => {
    const textElement = document.getElementById(elementId);
    if (!textElement) return;

    const content = textElement.textContent;
    textElement.innerHTML = "";

    content.split("").forEach((letter) => {
      const span = document.createElement("span");
      span.classList.add("letter");
      span.textContent = letter;
      if (letter === " ") span.style.marginRight = "6px";
      textElement.appendChild(span);
    });
  };

  const updateLetters = (elementId, multiplier = 1.0) => {
    const textElement = document.getElementById(elementId);
    if (!textElement) return;

    const letterElements = textElement.querySelectorAll(".letter");
    const rect = textElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate element position relative to viewport
    const elementTop = rect.top;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;

    // Animation starts when element enters viewport and completes BEFORE it reaches center
    // When element is at bottom of viewport: scrollProgress = 0
    // When element is at 75% to center: scrollProgress = 1 (fully revealed)
    const startPoint = windowHeight; // Element just entering viewport
    const endPoint = windowHeight * 0.6; // Complete animation when element is 60% up the viewport

    const scrollProgress = Math.max(0, Math.min(1, (startPoint - elementCenter) / (startPoint - endPoint)));

    // Ensure full reveal well before center
    const visibleLetters = Math.floor(scrollProgress * letterElements.length * multiplier);

    letterElements.forEach((letter, index) => {
      if (index < visibleLetters) {
        letter.classList.add("visible");
      } else {
        letter.classList.remove("visible");
      }
    });
  };

  useEffect(() => {
    // Wrap letters for all text elements that should have animation
    const textElementIds = [
      "heroTitle",
      "longBefore", "beforeCompilers", "beforeGit", "beforeIDEs",
      "oneMortal", "vasiIntro", "studentOnce", "survivor", "didntStay", "sheRose",
      "mortalTitle", "mortalPara1", "anotherMortal",
      "mortalPara2", "taughtHundreds", "mortalPara3",
      "sparkText", "oneRoom", "fourStudents", "whiteboard",
      "sharedDesire", "roomPortal", "firstExplorers", "architect",
      "birthTitle", "birthPara1", "stoppedBorrowing",
      "birthPara2", "byStudents", "birthPara3",
      "codingPlanet", "aCodingPlanet", "whereText", "dashboards", "quizzes", "learners",
      "techlearnText", "thisWasTechlearn", "fullyFormed",
      "orbitTitle", "orbitPara1", "orbitPara2", "futureText"
    ];

    textElementIds.forEach(id => wrapLetters(id));

    // Parallax scroll handler
    const handleScroll = () => {
      setScrollY(window.scrollY)

      // Update letter animations for all text elements
      textElementIds.forEach(id => updateLetters(id));
    }

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

    // Initialize letter wrapping for all text elements
    setTimeout(() => {
      textElementIds.forEach(id => wrapLetters(id));
    }, 100);

    // Add scroll listener for parallax
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden cosmic-background">
      {/* Cosmic Background with Parallax */}
      <div className="fixed inset-0 cosmic-starfield">
        {/* Extended gradient background to prevent gaps */}
        <div
          className="absolute inset-0 w-full h-[500vh] bg-gradient-to-b from-[#daf0fa] via-[#bceaff] via-[#4a90e2] to-[#2c5aa0] dark:from-[#020b23] dark:via-[#001233] dark:to-[#051a3e] transition-all duration-300"
          style={{
            transform: `translateY(${scrollY * 0.05}px)`,
            top: '-200vh'
          }}
        ></div>

        {/* Background stars layer (slowest) */}
        <div
          className="absolute w-full h-[500vh] opacity-95 dark:opacity-40"
          style={{
            transform: `translateY(${scrollY * 0.02}px)`,
            top: '-200vh'
          }}
        >
          {[...Array(120)].map((_, i) => (
            <div
              key={`bg-star-${i}`}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                boxShadow: '0 0 8px rgba(255, 255, 255, 1), 0 0 16px rgba(255, 255, 255, 0.8), 0 0 24px rgba(255, 255, 255, 0.6)',
                backgroundColor: '#ffffff',
                filter: 'brightness(1.5)'
              }}
            />
          ))}
        </div>

        {/* Mid-layer stars (medium speed) */}
        <div
          className="absolute w-full h-[500vh] opacity-100 dark:opacity-70"
          style={{
            transform: `translateY(${scrollY * 0.08}px)`,
            top: '-200vh'
          }}
        >
          {[...Array(90)].map((_, i) => (
            <div
              key={`mid-star-${i}`}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${1.5 + Math.random() * 2.5}px`,
                height: `${1.5 + Math.random() * 2.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                boxShadow: '0 0 12px rgba(255, 255, 255, 1), 0 0 24px rgba(255, 255, 255, 0.8), 0 0 36px rgba(255, 255, 255, 0.6)',
                backgroundColor: '#ffffff',
                filter: 'brightness(1.8)'
              }}
            />
          ))}
        </div>

        {/* Foreground stars (fastest) */}
        <div
          className="absolute w-full h-[500vh] opacity-100 dark:opacity-90"
          style={{
            transform: `translateY(${scrollY * 0.12}px)`,
            top: '-200vh'
          }}
        >
          {[...Array(70)].map((_, i) => (
            <div
              key={`fg-star-${i}`}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                boxShadow: '0 0 16px rgba(255, 255, 255, 1), 0 0 32px rgba(255, 255, 255, 0.8), 0 0 48px rgba(255, 255, 255, 0.6), 0 0 64px rgba(255, 255, 255, 0.4)',
                backgroundColor: '#ffffff',
                filter: 'brightness(2)'
              }}
            />
          ))}
        </div>

        {/* Nebula effects - fixed position, subtle */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-20"
        >
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-blue-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-2/3 left-1/2 w-48 h-48 bg-indigo-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Shooting stars */}
        <div
          className="absolute inset-0 opacity-90 dark:opacity-60"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={`shooting-star-${i}`}
              className="absolute w-4 h-1 bg-gradient-to-r from-white to-transparent rounded-full"
              style={{
                left: `${Math.random() * 80}%`,
                top: `${Math.random() * 80}%`,
                transform: `rotate(45deg)`,
                animation: `shootingStar ${5 + Math.random() * 5}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`,
                boxShadow: '0 0 8px rgba(255, 255, 255, 1), 0 0 16px rgba(255, 255, 255, 0.8)',
                filter: 'brightness(1.8)'
              }}
            />
          ))}
        </div>
      </div>

      <ScrollProgress />
      <Navbar />

      {/* Section 1: Hero Story */}
      <div className="relative z-10 hero-story-section min-h-screen flex flex-col justify-center py-12 pt-32">
        <div className="w-full px-6">
          {/* Main Heading with Gradient - Full Width */}
          <div
            className="text-center mb-20"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`
            }}
          >
            <h1 className="font-poppins text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-8 leading-[1.1]">
              <span id="heroTitle" className="brand-heading-primary hover-gradient-text">Forged by the Tech Gods.</span>
              <br />
              <span className="brand-heading-secondary hover-gradient-text">Built for the Next Generation.</span>
            </h1>

          </div>
        </div>
      </div>

      {/* Story Content Sections - Smooth Transitions */}
      <div className="relative z-10 w-full">
        <div className="w-full space-y-0 text-lg leading-relaxed">
            {/* Para 1: Poetic Introduction - Left Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.05}px)`
              }}
            >
              <div className="text-justify md:text-left max-w-5xl md:max-w-4xl mx-auto md:mx-0 space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl">
                <p id="longBefore" className="opacity-90 transition-opacity duration-1000">Long before code had syntax...</p>
                <p id="beforeCompilers" className="opacity-90 transition-opacity duration-1000">Before compilers whispered logic into circuits,</p>
                <p id="beforeGit" className="opacity-90 transition-opacity duration-1000">Before Git ruled the realms of version control,</p>
                <p id="beforeIDEs" className="opacity-90 transition-opacity duration-1000">Before IDEs lit up like constellations...</p>
              </div>
            </section>

            {/* Para 2: Vasi Introduction - Right Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.04}px)`
              }}
            >
              <div className="text-justify md:text-right max-w-5xl md:max-w-4xl mx-auto md:mx-0 md:ml-auto space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl">
                <p id="oneMortal" className="text-2xl md:text-3xl font-semibold text-[#011c56] dark:text-white">There was only one mortal —</p>
                <p id="vasiIntro" className="text-3xl md:text-4xl font-bold text-[#1946a4] dark:text-blue-300 leading-relaxed">
                  Vasi Prashanthi, a seeker buried under textbooks, tangled in broken tutorials and faded blackboard and diagrams.
                </p>
                <p id="studentOnce">A student once.</p>
                <p id="survivor">A survivor of Segmentation Faults and for-loops that spiraled into the void.</p>
                <p id="didntStay">But she didn't stay lost.</p>
                <p id="sheRose" className="font-semibold">She rose.</p>
              </div>
            </section>

            {/* Para 3: The Mortal Who Dared - Left Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.03}px)`
              }}
            >
              <div className="text-justify md:text-left max-w-5xl md:max-w-4xl mx-auto md:mx-0 space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <h2 id="mortalTitle" className="text-4xl md:text-5xl font-bold text-[#011c56] dark:text-white mb-8">
                  The Mortal Who Dared
                </h2>
                <p id="mortalPara1">
                  For years, she stood before classrooms — sharing logic, decoding the chaos of C, Java, Python — but always under someone else's banner.
                </p>
                <p id="anotherMortal">Another mortal's company. Another faded vision.</p>
              </div>
            </section>

            {/* Para 4: Her Voice - Right Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.025}px)`
              }}
            >
              <div className="text-justify md:text-right max-w-5xl md:max-w-4xl mx-auto md:mx-0 md:ml-auto space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <p id="mortalPara2">
                  Her voice echoed through rented halls, but the spark in her teaching couldn't  be contained by borrowed whiteboards and borrowed dreams.
                </p>
                <p id="taughtHundreds">She taught hundreds — sometimes thousands — yet always knew:</p>
                <p id="mortalPara3" className="font-semibold text-[#011c56] dark:text-white">Something greater awaited.</p>
              </div>
            </section>

            {/* Para 5: The Spark - Left Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.02}px)`
              }}
            >
              <div className="text-justify md:text-left max-w-5xl md:max-w-4xl mx-auto md:mx-0 space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <p id="sparkText" className="text-2xl md:text-3xl font-semibold">Then came a spark.</p>
                <p id="oneRoom">One room.</p>
                <p id="fourStudents">Four students.</p>
                <p id="whiteboard">A whiteboard stained with logic gates.</p>
              </div>
            </section>

            {/* Para 6: The Portal - Right Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.015}px)`
              }}
            >
              <div className="text-justify md:text-right max-w-5xl md:max-w-4xl mx-auto md:mx-0 md:ml-auto space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <p id="sharedDesire">
                  A shared desire to master C — not just as a language, but as a key to the machine realm.
                </p>
                <p id="roomPortal">That room became a portal.</p>
                <p id="firstExplorers">The four students — the first explorers.</p>
                <p id="architect">She — the Architect of a world yet to be formed.</p>
              </div>
            </section>

            {/* Para 7: The Birth - Left Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.01}px)`
              }}
            >
              <div className="text-justify md:text-left max-w-5xl md:max-w-4xl mx-auto md:mx-0 space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <h2 id="birthTitle" className="text-4xl md:text-5xl font-bold text-[#011c56] dark:text-white mb-8">
                  The Birth of a Coding Planet
                </h2>
                <p id="birthPara1">
                  From that single room, the spark spread — to homes, cities, and campuses.
                </p>
                <p id="stoppedBorrowing">Until one day, she stopped borrowing systems... and built her own.</p>
              </div>
            </section>

            {/* Para 8: World Coded from Scratch - Right Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0.005}px)`
              }}
            >
              <div className="text-justify md:text-right max-w-5xl md:max-w-4xl mx-auto md:mx-0 md:ml-auto space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <p id="birthPara2" className="text-2xl md:text-3xl font-semibold text-[#011c56] dark:text-white">
                  A world coded from scratch —
                </p>
                <p id="byStudents">By students. For students.</p>
                <p id="birthPara3">
                  With summer interns who learned, designed, and launched the platform you're using right now — in just four weeks.
                </p>
              </div>
            </section>

            {/* Para 9: Not a Company - Left Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * 0}px)`
              }}
            >
              <div className="text-justify md:text-left max-w-5xl md:max-w-4xl mx-auto md:mx-0 space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <p id="codingPlanet" className="text-3xl md:text-4xl font-bold text-[#011c56] dark:text-white">
                  Not a company.
                </p>
                <p id="aCodingPlanet" className="text-3xl md:text-4xl font-bold text-[#011c56] dark:text-white">A coding planet.</p>
                <p id="whereText" className="text-2xl font-semibold text-[#011c56] dark:text-white mt-8">Where:</p>
                <p id="dashboards">Dashboards orbit like moons,</p>
                <p id="quizzes">Quizzes rain like meteor showers,</p>
                <p id="learners">And every learner becomes a celestial body — given gravity, direction,and light.</p>
              </div>
            </section>

            {/* Para 10: TechLearn Solutions - Right Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * -0.005}px)`
              }}
            >
              <div className="text-justify md:text-right max-w-5xl md:max-w-4xl mx-auto md:mx-0 md:ml-auto space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <p id="techlearnText">This was no ordinary platform.</p>
                <p id="thisWasTechlearn">This was <strong className="text-[#011c56] dark:text-white text-2xl">TechLearn Solutions</strong> —</p>
                <p id="fullyFormed">A fully-formed ecosystem, fueled by her clarity, her code, and the ancient logic whispered by the Tech Gods themselves.</p>
              </div>
            </section>

            {/* Para 11: Join the Orbit - Left Aligned */}
            <section
              className="min-h-screen flex flex-col justify-center py-20 px-6"
              style={{
                transform: `translateY(${scrollY * -0.01}px)`
              }}
            >
              <div className="text-justify md:text-left max-w-5xl md:max-w-4xl mx-auto md:mx-0 space-y-4 text-[#1946a4] dark:text-blue-300 text-xl md:text-2xl leading-relaxed">
                <h2 id="orbitTitle" className="text-4xl md:text-5xl font-bold text-[#011c56] dark:text-white mb-8">
                  Join the Orbit
                </h2>
                <p id="orbitPara1">
                  Today, TechLearn is home to thousands of explorers — interns, students, hobbyists, and warriors of syntax.
                </p>
                <p id="orbitPara2">Together, we build. We debug. We launch.</p>
                <p id="futureText" className="text-3xl md:text-4xl font-bold text-[#011c56] dark:text-white mt-8">
                Because the future belongs to those who dare to decode it.
                </p>
              </div>
            </section>
          </div>
        </div>

      {/* Section 2: Meet the Summer Interns 25' */}
      <InternShowcase />

      {/* Section 3: Our Services */}
      <div className="relative z-10 services-section py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="relative z-20 text-3xl md:text-4xl font-bold text-[#011c56] dark:text-white mb-4">
            OUR SERVICES
          </h2>
          <h3 className="relative z-20 text-xl font-light text-[#1946a4] dark:text-blue-300 mb-16">
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
