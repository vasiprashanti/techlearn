import { useEffect, useRef, useState } from 'react'
import './JourneyPath.css'

const MILESTONES = [
  { progress: 0, x: 0, y: 350, label: 'TODAY', position: 'below' },
  { progress: 0.25, x: 650, y: 350, label: 'WEEK 1', position: 'above' },
  { progress: 0.5, x: 1080, y: 270, label: 'WEEK 2', position: 'below' },
  { progress: 0.75, x: 1450, y: 190, label: 'WEEK 3', position: 'above' },
  { progress: 1, x: 1600, y: 90, label: 'WEEK 4', position: 'above' }
]

const PATH_D = `
  M 0 350
  C 120 350,
    260 350,
    400 350
  L 650 350
  C 740 350,
    740 270,
    820 270
  L 1080 270
  C 1170 270,
    1170 190,
    1250 190
  L 1450 190
  C 1530 190,
    1530 90,
    1600 90
`

const STAGES = [
  {
    max: 0.125,
    step: 'TODAY',
    title: 'START HERE',
    text: 'Get clear on where you are going and what you need to learn next.'
  },
  {
    max: 0.375,
    step: 'WEEK 1',
    title: 'CORE SKILLS',
    text: 'Build your fundamentals while solving problems and getting feedback along the way.'
  },
  {
    max: 0.625,
    step: 'WEEK 2',
    title: 'BUILDING SKILLS',
    text: 'Take on harder problems and start connecting concepts on your own.'
  },
  {
    max: 0.875,
    step: 'WEEK 3',
    title: 'APPLYING SKILLS',
    text: "Work through realistic challenges that require you to combine what you've learned."
  },
  {
    max: Infinity,
    step: 'WEEK 4',
    title: 'REAL-WORLD READY',
    text: "Build, practice, and test yourself so you know what you can do and what's next."
  }
]

export default function JourneyPath() {
  const journeyRef = useRef(null)
  const wrapperRef = useRef(null)
  const pathRef = useRef(null)
  const progressPathRef = useRef(null)
  const characterRef = useRef(null)
  const milestoneRefs = useRef([])

  const [info, setInfo] = useState({
    step: 'TODAY',
    title: 'START HERE',
    text: 'Get clear on where you are going and what you need to learn next.'
  })

  useEffect(() => {
    const journey = journeyRef.current
    const wrapper = wrapperRef.current
    const path = pathRef.current
    const progressPath = progressPathRef.current
    const character = characterRef.current
    if (!journey || !wrapper || !path || !progressPath || !character) return

    let totalLength = 0
    try {
      totalLength = path.getTotalLength()
    } catch {
      totalLength = 2000
    }

    progressPath.style.strokeDasharray = totalLength
    progressPath.style.strokeDashoffset = totalLength

    let targetProgress = 0
    let currentProgress = 0
    let ticking = false
    let currentInfoState = ''
    let animationFrameId

    const positionMilestones = () => {
      if (!wrapper) return
      const scaleX = wrapper.clientWidth / 1600
      const scaleY = wrapper.clientHeight / 410

      MILESTONES.forEach((m, idx) => {
        const el = milestoneRefs.current[idx]
        if (el) {
          el.style.left = `${m.x * scaleX}px`
          el.style.top = `${m.y * scaleY}px`
        }
      })
    }

    const calculateJourneyProgress = () => {
      if (!journey) return
      const rect = journey.getBoundingClientRect()
      const scrollable = journey.offsetHeight - window.innerHeight

      if (scrollable <= 0) {
        targetProgress = 1
        return
      }

      const progress = -rect.top / scrollable
      targetProgress = Math.max(0, Math.min(1, progress))
    }

    const updateCharacter = (progress) => {
      if (!path || !character || !wrapper) return
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

        character.style.left = `${x}px`
        character.style.top = `${y}px`
        character.style.transform = `translate(-50%, -100%) rotate(${angle * 0.15}deg)`
      } catch {
        // SVG math fallback
      }
    }

    const updateMilestones = (progress) => {
      MILESTONES.forEach((m, idx) => {
        const el = milestoneRefs.current[idx]
        if (!el) return
        el.classList.toggle('completed', progress >= m.progress)
        el.classList.toggle('active', Math.abs(progress - m.progress) < 0.035)
      })
    }

    const updateJourneyInfo = (progress) => {
      const stage = STAGES.find((s) => progress < s.max) || STAGES[STAGES.length - 1]
      const newState = `${stage.step}|${stage.title}|${stage.text}`

      if (newState !== currentInfoState) {
        currentInfoState = newState
        setInfo({
          step: stage.step,
          title: stage.title,
          text: stage.text
        })
      }
    }

    const animateJourney = () => {
      const difference = targetProgress - currentProgress
      currentProgress += difference * 0.065

      if (Math.abs(difference) < 0.00005) {
        currentProgress = targetProgress
      }

      progressPath.style.strokeDashoffset = totalLength * (1 - currentProgress)

      updateCharacter(currentProgress)
      updateMilestones(currentProgress)
      updateJourneyInfo(currentProgress)

      animationFrameId = requestAnimationFrame(animateJourney)
    }

    const onScroll = () => {
      if (ticking) return
      requestAnimationFrame(() => {
        calculateJourneyProgress()
        ticking = false
      })
      ticking = true
    }

    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        positionMilestones()
        calculateJourneyProgress()
        updateCharacter(currentProgress)
      }, 80)
    }

    const onOrientation = () => {
      setTimeout(() => {
        positionMilestones()
        calculateJourneyProgress()
        updateCharacter(currentProgress)
      }, 150)
    }

    // Initialize
    positionMilestones()
    calculateJourneyProgress()
    updateCharacter(0)
    updateMilestones(0)
    updateJourneyInfo(0)
    animateJourney()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrientation)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrientation)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <section className="journey-scroll" id="journey" ref={journeyRef}>
      <div className="journey-sticky">
        {/* HEADER */}
        <div className="journey-header">
          <div className="journey-eyebrow">THE SOLUTION</div>
          <h2 className="journey-title">
            One clear <i>path</i>
          </h2>
        </div>

        {/* PATH AREA */}
        <div className="path-wrapper" id="pathWrapper" ref={wrapperRef}>
          <svg
            className="journey-svg"
            id="journeySvg"
            viewBox="0 0 1600 410"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              ref={pathRef}
              id="journeyPath"
              className="path-base"
              d={PATH_D}
            />
            <path
              ref={progressPathRef}
              id="journeyProgress"
              className="path-progress"
              d={PATH_D}
            />
          </svg>

          {/* MILESTONES */}
          {MILESTONES.map((m, idx) => (
            <div
              key={m.label}
              ref={(el) => (milestoneRefs.current[idx] = el)}
              className={`milestone ${m.position}`}
              data-progress={m.progress}
              data-x={m.x}
              data-y={m.y}
            >
              <div className="milestone-dot" />
              <div className="milestone-label">{m.label}</div>
            </div>
          ))}

          {/* CHARACTER */}
          <div className="character" id="character" ref={characterRef} aria-hidden="true">
            <div className="character-head" />
            <div className="character-body" />
            <div className="character-leg left" />
            <div className="character-leg right" />
          </div>
        </div>

        {/* JOURNEY INFO */}
        <div className="journey-info" id="journeyInfo">
          <div className="journey-info-step" id="journeyInfoStep">
            {info.step}
          </div>
          <h3 className="journey-info-title" id="journeyInfoTitle">
            {info.title}
          </h3>
          <p className="journey-info-text" id="journeyInfoText">
            {info.text}
          </p>
        </div>
      </div>
    </section>
  )
}
