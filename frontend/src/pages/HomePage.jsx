import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const codeFragments = [
  "DSA.solve(problem)",
  "SQL.query()",
  "OOPS.inheritance",
  "DBMS.normalize()",
  "CN.protocols",
  "aptitude.score++",
  "array.search()",
  "binarySearch(target)",
  "sort(array)",
  "recursion.solve()",
  "JOIN users ON users.id",
  "SELECT * FROM candidates",
  "assessment.complete()",
  "technical_round.prepare()",
  "mock_interview.start()",
  "target_company = 'YOUR COMPANY'",
  "placement.ready = true",
  "candidate.progress += 1",
  "interview.confidence++",
  "coding.solve()",
  "dsa.practice()",
  "sql.optimize(query)",
  "technical.skills.build()",
  "30_days.start()",
  "array.reverse()",
  "stack.push(element)",
  "queue.offer(candidate)",
  "tree.traverse()",
  "graph.shortestPath()",
  "company.questions()",
  "interview.evaluate()",
  "feedback.generate()",
  "weakAreas.identify()",
  "practice.again()",
  "candidate.score++"
]

const searchQueries = [
  "best roadmap for TCS placements",
  "how to prepare for campus placements",
  "DSA roadmap for SDE roles",
  "SQL questions asked in interviews",
  "how to crack Infosys interview",
  "Java interview questions for freshers",
  "best placement preparation strategy",
  "what to study for online assessments",
  "how to prepare for my target company"
]

const reviewsData = [
  {
    quote: "“The daily plan made my preparation much less overwhelming.”",
    name: "Ananya K.",
    role: "College Student · Placement Program",
    avatar: "AK"
  },
  {
    quote: "“I finally knew what I was supposed to study every day instead of jumping between random resources.”",
    name: "Tanvika V.",
    role: "College Student · Placement Program",
    avatar: "TV"
  },
  {
    quote: "“The company-focused questions helped me feel much more confident before my interview.”",
    name: "Rahul S.",
    role: "College Student · Placement Program",
    avatar: "RS"
  }
]

const faqsData = [
  {
    question: "Is TechLearn only for coding students?",
    answer: "TechLearn is designed around placement preparation, including technical preparation, aptitude, coding, company-focused practice and interview readiness."
  },
  {
    question: "What happens during the 30 days?",
    answer: "You follow a structured path with daily tasks, practice, challenges and preparation that progressively moves you toward real placement rounds."
  },
  {
    question: "Do I need to know DSA before joining?",
    answer: "No. The roadmap is designed to give you a clear progression rather than assuming you already know everything."
  },
  {
    question: "Is this a course or a placement preparation platform?",
    answer: "TechLearn is built as a placement preparation platform. The focus is not just consuming lessons — it is knowing what to practice and completing the work that moves you forward."
  },
  {
    question: "Is the payment recurring?",
    answer: "No. Both plans are one-time purchases. There is no monthly subscription."
  },
  {
    question: "Can I change my target company later?",
    answer: "Your preparation can adapt as your placement goals change. Your target companies can be updated as you progress."
  }
]

const milestonesData = [
  { label: "START", progress: 0.0, x: 80, y: 70, position: "above start-node" },
  { label: "FOUNDATION", progress: 0.20, x: 760, y: 70, position: "above" },
  { label: "PRACTICE", progress: 0.36, x: 1280, y: 170, position: "above" },
  { label: "REAL ROUNDS", progress: 0.65, x: 500, y: 270, position: "above" },
  { label: "INTERVIEW READY", progress: 1.0, x: 1520, y: 350, position: "above end-node" }
]

const pathD = "M 80 70 L 760 70 C 850 70, 850 170, 940 170 L 1280 170 C 1370 170, 1370 270, 1280 270 L 500 270 C 410 270, 410 350, 500 350 L 1520 350"

const HomePage = () => {
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  // Code line animation state
  const codeFieldRef = useRef(null)

  // Tilt animation state
  const platformStageRef = useRef(null)
  const platformWindowRef = useRef(null)

  // Journey animation state
  const journeySectionRef = useRef(null)
  const pathWrapperRef = useRef(null)
  const pathRef = useRef(null)
  const progressPathRef = useRef(null)
  const characterRef = useRef(null)
  const [journeyStatusText, setJourneyStatusText] = useState("START · BUILD YOUR FOUNDATION")
  const [milestonesState, setMilestonesState] = useState([
    { completed: true, active: true },
    { completed: false, active: false },
    { completed: false, active: false },
    { completed: false, active: false },
    { completed: false, active: false }
  ])

  // Review carousel state
  const [currentReview, setCurrentReview] = useState(1)

  // FAQ open index state
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  // Final CTA typewriter state
  const [typingText, setTypingText] = useState("")

  // Navbar sticky scroll state
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOverDarkSection, setIsOverDarkSection] = useState(false)
  const resultsSectionRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 20)

      if (resultsSectionRef.current) {
        const rect = resultsSectionRef.current.getBoundingClientRect()
        // Navbar is at top 0-84px; detect if results section overlaps top viewport
        if (rect.top <= 65 && rect.bottom >= 45) {
          setIsOverDarkSection(true)
        } else {
          setIsOverDarkSection(false)
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // --- 1. Code Background Particle Generation ---
  useEffect(() => {
    const codeField = codeFieldRef.current
    if (!codeField) return

    const createCodeLine = () => {
      if (!codeField) return
      const line = document.createElement("div")
      line.className = "tl-code-line"
      line.textContent = "> " + codeFragments[Math.floor(Math.random() * codeFragments.length)]
      const side = Math.random()
      line.style.left = side < 0.5 ? Math.random() * 30 + "%" : 65 + Math.random() * 30 + "%"
      line.style.top = 5 + Math.random() * 90 + "%"
      line.style.animationDuration = 5 + Math.random() * 3 + "s"
      line.style.animationDelay = Math.random() * -8 + "s"

      if (Math.random() > 0.82) {
        line.classList.add("highlight")
      }

      codeField.appendChild(line)
      setTimeout(() => {
        if (line.parentNode === codeField) {
          line.remove()
        }
      }, 9000)
    }

    for (let i = 0; i < 30; i++) {
      createCodeLine()
    }

    const interval = setInterval(createCodeLine, 350)
    return () => clearInterval(interval)
  }, [])

  // --- 2. Platform Mockup Tilt on Mousemove ---
  useEffect(() => {
    const platformStage = platformStageRef.current
    const platformWindow = platformWindowRef.current
    if (!platformStage || !platformWindow) return

    let tiltX = 1.5
    let tiltY = -3
    let targetX = 1.5
    let targetY = -3
    let animationFrameId

    const handleMouseMove = (e) => {
      if (window.innerWidth <= 700 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return
      }
      const rect = platformStage.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left) / rect.width
      const mouseY = (e.clientY - rect.top) / rect.height

      targetY = (mouseX - 0.5) * 7
      targetX = 1.5 - (mouseY - 0.5) * 2.2
    }

    const handleMouseLeave = () => {
      targetX = 1.5
      targetY = -3
    }

    const animateTilt = () => {
      tiltX += (targetX - tiltX) * 0.08
      tiltY += (targetY - tiltY) * 0.08

      if (window.innerWidth > 700 && platformWindow) {
        platformWindow.style.transform = `perspective(1800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(8px) scale(0.97)`
      }
      animationFrameId = requestAnimationFrame(animateTilt)
    }

    platformStage.addEventListener("mousemove", handleMouseMove)
    platformStage.addEventListener("mouseleave", handleMouseLeave)

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animateTilt()
    }

    return () => {
      platformStage.removeEventListener("mousemove", handleMouseMove)
      platformStage.removeEventListener("mouseleave", handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // --- 3. Interactive Roadmap Animation (Sticky scroll + SVG path character tracking) ---
  useEffect(() => {
    const journey = journeySectionRef.current
    const wrapper = pathWrapperRef.current
    const path = pathRef.current
    const progressPath = progressPathRef.current
    const charElem = characterRef.current
    if (!journey || !wrapper || !path || !progressPath || !charElem) return

    let totalLength = 0
    try {
      totalLength = path.getTotalLength()
    } catch {
      totalLength = 2000
    }

    progressPath.style.strokeDasharray = `${totalLength}`
    progressPath.style.strokeDashoffset = `${totalLength}`

    let targetProgress = 0
    let currentProgress = 0
    let animFrameId

    const calculateProgress = () => {
      const rect = journey.getBoundingClientRect()
      const scrollDistance = journey.offsetHeight - window.innerHeight
      if (scrollDistance <= 0) {
        targetProgress = 1
        return
      }
      // When the journey section pins at top: 0, -rect.top advances from 0 to scrollDistance
      let progress = -rect.top / scrollDistance
      progress = Math.max(0, Math.min(1, progress))
      targetProgress = progress
    }

    const updateCharacterAndMilestones = (progress) => {
      try {
        const point = path.getPointAtLength(totalLength * progress)
        const scaleX = wrapper.clientWidth / 1600
        const scaleY = wrapper.clientHeight / 410

        const x = point.x * scaleX
        const y = point.y * scaleY

        const ahead = Math.min(totalLength, totalLength * progress + 8)
        const nextPoint = path.getPointAtLength(ahead)
        const dx = nextPoint.x - point.x
        const dy = nextPoint.y - point.y
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI

        charElem.style.left = `${x}px`
        charElem.style.top = `${y}px`
        charElem.style.transform = `translate(-50%, -100%) rotate(${angle * 0.15}deg)`
      } catch (err) {
        // fallback
      }

      setMilestonesState(
        milestonesData.map((m, idx) => ({
          completed: progress >= m.progress || (idx === 0),
          active: Math.abs(progress - m.progress) < 0.05 || (idx === 0 && progress < 0.05) || (idx === 4 && progress > 0.95)
        }))
      )

      if (progress < 0.10) {
        setJourneyStatusText("START · BUILD YOUR FOUNDATION")
      } else if (progress < 0.28) {
        setJourneyStatusText("FOUNDATION · BUILD THE SKILLS")
      } else if (progress < 0.50) {
        setJourneyStatusText("PRACTICE · TRAIN WITH PURPOSE")
      } else if (progress < 0.82) {
        setJourneyStatusText("REAL ROUNDS · PREPARE FOR THE INTERVIEW")
      } else {
        setJourneyStatusText("INTERVIEW READY · YOU KNOW WHAT'S NEXT")
      }
    }

    const animateJourneyLoop = () => {
      currentProgress += (targetProgress - currentProgress) * 0.04
      progressPath.style.strokeDashoffset = `${totalLength * (1 - currentProgress)}`
      updateCharacterAndMilestones(currentProgress)
      animFrameId = requestAnimationFrame(animateJourneyLoop)
    }

    calculateProgress()
    animateJourneyLoop()

    window.addEventListener("scroll", calculateProgress, { passive: true })
    window.addEventListener("resize", calculateProgress)

    return () => {
      window.removeEventListener("scroll", calculateProgress)
      window.removeEventListener("resize", calculateProgress)
      cancelAnimationFrame(animFrameId)
    }
  }, [])

  // --- 4. Review Carousel Auto-play ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviewsData.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  // --- 5. Final CTA Typewriter Animation ---
  useEffect(() => {
    let qIdx = 0
    let cIdx = 0
    let isDeleting = false
    let timeoutId

    const type = () => {
      const currentQuery = searchQueries[qIdx]
      if (!isDeleting) {
        setTypingText(currentQuery.substring(0, cIdx + 1))
        cIdx++
        if (cIdx === currentQuery.length) {
          isDeleting = true
          timeoutId = setTimeout(type, 1800)
          return
        }
        timeoutId = setTimeout(type, 55)
      } else {
        setTypingText(currentQuery.substring(0, cIdx - 1))
        cIdx--
        if (cIdx === 0) {
          isDeleting = false
          qIdx = (qIdx + 1) % searchQueries.length
          timeoutId = setTimeout(type, 400)
          return
        }
        timeoutId = setTimeout(type, 30)
      }
    }

    type()
    return () => clearTimeout(timeoutId)
  }, [])

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="tl-landing">
      {/* =========================================================
           00 — FIXED / STICKY NAVBAR
      ========================================================= */}
      <header className={`tl-nav-wrapper ${isScrolled ? 'scrolled' : ''} ${isOverDarkSection ? 'on-dark-section' : ''}`}>
        <nav className="tl-nav">
          <Link to="/" className="tl-logo">
            TechLearn
          </Link>

          <ul className="tl-nav-links">
            <li><Link to="/learn">Learn</Link></li>
            <li><a href="#journey">Roadmaps</a></li>
            <li><a href="#pricing">Hiring</a></li>
          </ul>

          <div className="tl-nav-action">
            <button
              onClick={toggleTheme}
              className="tl-theme-btn"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/signup" className="tl-nav-cta">
              SIGN UP
            </Link>
          </div>
        </nav>
      </header>

      {/* =========================================================
           01 — HERO (hero.html exact specifications)
      ========================================================= */}
      <section className="tl-hero" id="start">
        <div className="tl-code-field" ref={codeFieldRef}></div>

        <main className="tl-hero-content">
          <h1 className="tl-hero-title">
            <span>Where Placement Preparation</span>
            <span>Meets Company Patterns</span>
          </h1>

          <p className="tl-hero-description">
            Know what to do every day. Practice real interview questions.<br />
            Stay on track for your dream job.
          </p>

          <div className="tl-hero-actions">
            <Link to="/signup" className="tl-primary-button">
              START NOW →
            </Link>
          </div>
        </main>
      </section>

      {/* =========================================================
           02 — PLATFORM PREVIEW (Placement Platform Section)
      ========================================================= */}
      <section className="tl-platform-preview" id="platform">
        <div className="tl-platform-content">
          <div className="tl-platform-eyebrow">
            EVERYTHING IN ONE PLACE
          </div>

          <h2 className="tl-platform-title">
            <span>The only</span> PLACEMENT PLATFORM <span>you need</span>
          </h2>

          <p className="tl-platform-description">
            Your roadmap, daily practice, challenges and placement readiness
            stay together so you always know what to do next.
          </p>

          <div className="tl-platform-stage" ref={platformStageRef}>
            <div className="tl-platform-glow"></div>

            <div className="tl-platform-window" ref={platformWindowRef}>
              <div className="tl-browser-bar">
                <div className="tl-browser-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="tl-browser-address">
                  app.techlearn.in/dashboard
                </div>
              </div>

              <div className="tl-dashboard">
                <aside className="tl-dashboard-sidebar">
                  <div className="tl-dashboard-logo">TechLearn</div>
                  <div className="tl-side-item active">
                    <span>⌂</span> Dashboard
                  </div>
                  <div className="tl-side-item">
                    <span>◫</span> My Program
                  </div>
                  <div className="tl-side-item">
                    <span>✓</span> Daily Tasks
                  </div>
                  <div className="tl-side-item">
                    <span>◈</span> Challenges
                  </div>
                  <div className="tl-side-item">
                    <span>↗</span> Progress
                  </div>
                </aside>

                <main className="tl-dashboard-main">
                  <div className="tl-dashboard-top">
                    <div>
                      <div className="tl-dash-small">DAY 12 OF 30</div>
                      <h3>Good morning, Tanvika.</h3>
                    </div>
                    <div className="tl-dash-profile">TV</div>
                  </div>

                  <div className="tl-progress-card">
                    <div className="tl-progress-copy">
                      <span className="tl-dash-label">YOUR PLACEMENT PATH</span>
                      <strong>40% complete</strong>
                      <p>Keep going. You're building momentum.</p>
                    </div>
                    <div className="tl-progress-ring">12</div>
                  </div>

                  <div className="tl-dashboard-grid">
                    <div className="tl-task-card">
                      <div className="tl-card-top">
                        <span>DAILY TASK</span>
                        <b>+50 XP</b>
                      </div>
                      <h4>Today's practice</h4>
                      <div className="tl-task-row">
                        <span>DSA</span>
                        <strong>2 / 3</strong>
                      </div>
                      <div className="tl-task-row">
                        <span>SQL</span>
                        <strong>1 / 2</strong>
                      </div>
                      <div className="tl-task-row">
                        <span>Aptitude</span>
                        <strong>3 / 3</strong>
                      </div>
                    </div>

                    <div className="tl-challenge-card">
                      <div className="tl-card-top">
                        <span>DAILY CHALLENGE</span>
                        <b>10:42</b>
                      </div>
                      <h4>Two Sum</h4>
                      <p>Solve today's coding challenge.</p>
                      <div className="tl-challenge-button">
                        Solve Challenge →
                      </div>
                    </div>

                    <div className="tl-score-card">
                      <div className="tl-card-top">
                        <span>PLACEMENT READINESS</span>
                      </div>
                      <div className="tl-score-number">
                        78<span>%</span>
                      </div>
                      <div className="tl-score-bar">
                        <div></div>
                      </div>
                      <p>Strong progress this week</p>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
           03 — CLEAR PATH (Interactive Roadmap Animation)
      ========================================================= */}
      <section className="tl-journey-scroll" id="journey" ref={journeySectionRef}>
        <div className="tl-journey-sticky">
          <div className="tl-journey-header">
            <div className="tl-journey-eyebrow">
              NO MORE "WHAT SHOULD I STUDY?"
            </div>
            <h2 className="tl-journey-title">
              ONE CLEAR<br />PATH.
            </h2>
          </div>

          <div className="tl-path-wrapper" ref={pathWrapperRef}>
            <svg
              className="tl-journey-svg"
              viewBox="0 0 1600 410"
              preserveAspectRatio="none"
            >
              <path
                ref={pathRef}
                className="tl-path-base"
                d={pathD}
              />
              <path
                ref={progressPathRef}
                className="tl-path-progress"
                d={pathD}
              />
            </svg>

            {milestonesData.map((m, idx) => {
              const state = milestonesState[idx] || { completed: false, active: false }
              return (
                <div
                  key={idx}
                  className={`tl-milestone ${m.position} ${state.completed ? 'completed' : ''} ${state.active ? 'active' : ''}`}
                  style={{
                    left: `${(m.x / 1600) * 100}%`,
                    top: `${(m.y / 410) * 100}%`
                  }}
                >
                  <div className="tl-milestone-dot"></div>
                  <div className="tl-milestone-label">{m.label}</div>
                </div>
              )
            })}

            <div className="tl-character" ref={characterRef}>
              <div className="tl-character-head"></div>
              <div className="tl-character-body"></div>
              <div className="tl-character-leg left"></div>
              <div className="tl-character-leg right"></div>
            </div>
          </div>

          <div className="tl-journey-footer-bar">
            <span className="tl-journey-checkpoint-chip">
              <span className="tl-chip-dot"></span>
              {journeyStatusText}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================
           04 — RESULTS / REVIEWS
      ========================================================= */}
      <section className="tl-results" id="results" ref={resultsSectionRef}>
        <div className="section-inner">
          <div className="tl-results-header">
            <h2>
              FROM THE <br />COMMUNITY
            </h2>
            <p>
              Students who trained with our placement roadmaps share their journey and success.
            </p>
          </div>

          <div className="tl-review-carousel">
            <div className="tl-review-track">
              {reviewsData.map((review, idx) => {
                let positionClass = "hidden-card"
                if (idx === currentReview) {
                  positionClass = "center"
                } else if (idx === (currentReview - 1 + reviewsData.length) % reviewsData.length) {
                  positionClass = "left"
                } else if (idx === (currentReview + 1) % reviewsData.length) {
                  positionClass = "right"
                }

                return (
                  <article key={idx} className={`tl-review-card ${positionClass}`}>
                    <div className="tl-review-quote">
                      {review.quote}
                    </div>
                    <div className="tl-review-student">
                      <div className="tl-review-avatar">
                        {review.avatar}
                      </div>
                      <div>
                        <strong>{review.name}</strong>
                        <span>{review.role}</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="tl-review-dots">
              {reviewsData.map((_, idx) => (
                <button
                  key={idx}
                  className={`tl-review-dot ${idx === currentReview ? 'active' : ''}`}
                  onClick={() => setCurrentReview(idx)}
                  aria-label={`Show review ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
           05 — PRICING
      ========================================================= */}
      <section className="tl-pricing-section" id="pricing">
        <div className="tl-pricing-inner">
          <div className="tl-pricing-header">
            <h2 className="tl-pricing-title">
              PICK YOUR PATH.
            </h2>
            <p className="tl-pricing-description">
              Build a real technical skill or prepare specifically for placements. One focused program, structured practice, and a clear path forward.
            </p>
          </div>

          <div className="tl-pricing-grid">
            {/* Skill Program */}
            <article className="tl-price-card">
              <div className="tl-price-name">
                Build real technical skills.
              </div>
              <h3 className="tl-price-card-title">SKILL PROGRAM</h3>
              <p className="tl-price-subtitle">
                Pick a skill and build real ability through structured learning, daily practice and hands-on work.
              </p>
              <div className="tl-price">
                ₹399 <small>/year</small>
              </div>
              <div className="tl-price-divider"></div>
              <ul className="tl-price-features">
                <li>DSA with Java or Python</li>
                <li>AI, ML & Generative AI</li>
                <li>Structured roadmap with concept-wise notes</li>
                <li>Daily tasks, challenges & quizzes</li>
                <li>Weekly assessments & progress tracking</li>
                <li>Monthly mini-project ideas + course certificate</li>
              </ul>
              <Link to="/signup" className="tl-price-button">
                START LEARNING →
              </Link>
            </article>

            {/* Placement Program (Featured) */}
            <article className="tl-price-card featured">
              <div className="tl-price-badge">
                MOST POPULAR
              </div>
              <div className="tl-price-name">
                Prepare for your placement.
              </div>
              <h3 className="tl-price-card-title">PLACEMENT PROGRAM</h3>
              <p className="tl-price-subtitle">
                A focused preparation system for students who want to become interview-ready and improve their chances of landing a job.
              </p>
              <div className="tl-price">
                ₹799 <small>/year</small>
              </div>
              <div className="tl-price-divider"></div>
              <ul className="tl-price-features">
                <li>Structured DSA practice</li>
                <li>Aptitude & Core CS preparation</li>
                <li>Company & role-based interview questions</li>
                <li>Daily placement tasks & challenges</li>
                <li>Mock interview + feedback report</li>
                <li>Jobs & internships board</li>
              </ul>
              <Link to="/signup" className="tl-price-button">
                START PREPARING →
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* =========================================================
           06 — FAQ
      ========================================================= */}
      <section className="tl-faq-section" id="faqs">
        <div className="tl-faq-inner">
          <div className="tl-faq-header">
            <h2 className="tl-faq-title">
              QUESTIONS? WE GOT YOU.
            </h2>
            <p className="tl-faq-subtitle">
              These are just the most asked ones so far, feel free to reach out anytime!
            </p>
          </div>

          <div className="tl-faq-list">
            {faqsData.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div key={idx} className={`tl-faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="tl-faq-question"
                    type="button"
                    onClick={() => toggleFaq(idx)}
                  >
                    <span>{faq.question}</span>
                    <span className="tl-faq-plus">+</span>
                  </button>
                  <div className="tl-faq-answer">
                    {faq.answer}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
           07 — FINAL CTA (hero.html exact specifications)
      ========================================================= */}
      <section className="tl-search-section" id="start-program">
        <div className="tl-search-content">
          <div className="tl-search-eyebrow">
            TIRED OF FIGURING IT OUT?
          </div>

          <h2 className="tl-search-title">
            <span className="tl-cta-line1">YOU SEARCH.</span>
            <span className="tl-cta-line2">WE MAP IT OUT.</span>
          </h2>

          <div className="tl-search-box">
            <div className="tl-search-icon">⌕</div>
            <div className="tl-search-text">
              <span>{typingText}</span>
              <span className="tl-typing-cursor"></span>
            </div>
          </div>

          <Link to="/signup" className="tl-search-button">
            BUILD MY ROADMAP →
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage

