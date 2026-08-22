import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import FreeAssessmentModal from '../components/Learn/FreeAssessmentModal'
import JourneyPath from '../components/JourneyPath'
import ProblemSection from '../components/ProblemSection'

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

const HomePage = () => {
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  // Code line animation state
  const codeFieldRef = useRef(null)

  // Review carousel state
  const [currentReview, setCurrentReview] = useState(1)

  // FAQ open index state
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  // Final CTA typewriter state
  const [typingText, setTypingText] = useState("")

  // Auth state & user dropdown
  const { user, isAuthenticated, logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Navbar sticky scroll state
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOverDarkSection, setIsOverDarkSection] = useState(false)
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false)
  const resultsSectionRef = useRef(null)

  useEffect(() => {
    if (!isUserMenuOpen) return undefined

    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false)
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuOpen])

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
           01 — HERO (hero.html exact specifications)
      ========================================================= */}
      <section className="tl-hero" id="start">
        <div className="tl-code-field" ref={codeFieldRef}></div>

        <main className="tl-hero-content">
          {isAuthenticated ? (
            <>
              <h1 className="tl-hero-title">
                Choose <i>your</i>&nbsp;&nbsp;move.
              </h1>

              <p className="tl-hero-description">
                Code on your own, or pick up where you left off.
              </p>

              <div className="tl-hero-actions">
                <Link to="/compiler" className="tl-primary-button">
                  START CODING
                </Link>
                <Link to="/dashboard" className="tl-secondary-button">
                  RESUME LEARNING
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="tl-hero-title">
                Choose <i>your</i>&nbsp;&nbsp;next move.
              </h1>

              <p className="tl-hero-description">
                Pick a direction. Build what it takes to get there.
              </p>

              <div className="tl-hero-actions">
                <Link to="/signup?goal=job" className="tl-primary-button">
                  GET JOB-READY
                </Link>
                <Link to="/signup?goal=skill" className="tl-secondary-button">
                  LEARN A SKILL
                </Link>
              </div>
            </>
          )}
        </main>
      </section>

      {/* =========================================================
           02 — THE PROBLEM (from Index.html)
      ========================================================= */}
      <ProblemSection />

      {/* =========================================================
           03 — CLEAR PATH (from Path.html)
      ========================================================= */}
      <JourneyPath />

      {/* =========================================================
           04 — REVIEWS / FROM THE COMMUNITY (Light mode)
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
           05 — PRICING (from Index.html / screenshot)
      ========================================================= */}
      <section className="tl-pricing-section" id="pricing">
        <div className="tl-pricing-inner">
          <div className="tl-pricing-header">
            <span className="tl-pricing-eyebrow">THE NEXT STEP</span>
            <h2 className="tl-pricing-title">
              Choose <i>your</i>&nbsp;&nbsp;path
            </h2>
          </div>

          <div className="tl-pricing-grid">
            {/* Skill Program */}
            <article className="tl-price-card">
              <div className="tl-price-badge secondary-badge">BEGINNER FRIENDLY</div>
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
              <div className="tl-price-badge">MOST POPULAR</div>
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
           06 — FAQS (Light mode)
      ========================================================= */}
      <section className="tl-faq-section" id="faqs">
        <div className="tl-faq-inner">
          <div className="tl-faq-header">
            <span className="tl-faq-eyebrow">GOT QUESTIONS?</span>
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
           05 — FINAL CTA (from Index.html / screenshot)
      ========================================================= */}
      <section className="tl-search-section" id="start-program">
        <div className="tl-search-content">
          <div className="tl-search-eyebrow">
            SEARCH RESULTS <span>≠</span> YOUR RESULTS.
          </div>

          <h2 className="tl-search-title">
            <span>
              <u><i>stop</i></u> guessing
            </span>
          </h2>

          <div className="tl-search-box">
            <div className="tl-search-icon">⌕</div>
            <div className="tl-search-text">
              <span>{typingText}</span>
              <span className="tl-typing-cursor"></span>
            </div>
          </div>

          <Link to="/signup" className="tl-search-button">
            FIND YOUR PATH
          </Link>
        </div>
      </section>

      <FreeAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
      />
    </div>
  )
}

export default HomePage

