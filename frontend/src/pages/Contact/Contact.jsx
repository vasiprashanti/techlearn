import React, { useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import Navbar from '../../components/Navbar'
import ScrollProgress from '../../components/ScrollProgress'

const Contact = () => {
  const { theme } = useTheme()

  useEffect(() => {
    // Blob animation and tooltip logic
    const messages = [
      "Need a brain break?",
      "Deploy now, cry later.",
      "Your code loves you (sometimes).",
      "Bug found? Or feature?",
      "Late night debug squad?",
      "Console.log therapy session?",
      "Pixel perfect yet?",
      "404 mood today?",
      "Glitch in the matrix?",
      "Flexbox acting up again?",
      "Drop your idea, we'll vibe.",
      "Emoji code review?",
      "Send memes, not bugs.",
      "New framework? Brave move.",
      "Your CSS is showing.",
      "Commit messages on point?",
      "Weekend deploy? Bold.",
      "Coffee break? Approved.",
      "Feeling stuck? Talk to us."
    ]

    let displayedMessages = []

    function createTooltip() {
      const blob = document.getElementById('contact-blob')
      if (!blob) return

      // If all messages have been shown, reset the displayed messages
      if (displayedMessages.length === messages.length) {
        displayedMessages = []
      }

      // Get a random message that hasn't been shown in the last 4 iterations
      let message
      do {
        message = messages[Math.floor(Math.random() * messages.length)]
      } while (displayedMessages.includes(message) && displayedMessages.length > 4)

      // Add message to the displayed messages array
      displayedMessages.push(message)

      // Create the tooltip element
      const tooltip = document.createElement('div')
      tooltip.classList.add('contact-tooltip')
      tooltip.textContent = message

      // Remove any existing tooltip
      const oldTooltip = document.querySelector('.contact-tooltip')
      if (oldTooltip) oldTooltip.remove()

      // Random position around the blob
      const positions = [
        { top: 'calc(50% - 5px)', left: '90%' },
        { top: 'calc(50% - 5px)', right: '90%' },
        { top: '-30px', left: '50%', transform: 'translateX(-40%)' },
        { bottom: '-30px', left: '50%', transform: 'translateX(-40%)' }
      ]

      const pos = positions[Math.floor(Math.random() * positions.length)]
      Object.assign(tooltip.style, pos)

      blob.appendChild(tooltip)

      // Remove tooltip after its animation
      setTimeout(() => {
        tooltip.remove()
      }, 3000)
    }

    // Run every 2 seconds
    const tooltipInterval = setInterval(createTooltip, 2000)

    return () => {
      clearInterval(tooltipInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
      <ScrollProgress />
      <Navbar />

      {/* Wanna Talk Section */}
      <div className="wanna-talk-section py-12 pt-32 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[#011c56] dark:text-white mb-4">
            WANNA TALK?
          </h1>
          <h3 className="text-xl md:text-2xl font-light text-[#1946a4] dark:text-blue-300 mb-16">
            We code, we create, we overshare at 2AM!
          </h3>
          
          {/* Animated Blob */}
          <div className="contact-blob" id="contact-blob"></div>
          
          {/* Contact Buttons */}
          <div className="contact-buttons flex flex-wrap justify-center gap-6 pt-20 pb-12">
            <a 
              href="tel:+919347055962" 
              className="contact-btn bg-[#00225c] hover:bg-[#001a4a] text-white px-8 py-4 rounded-full text-lg transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm"
            >
              Ring Ring!
            </a>
            <a 
              href="mailto:techlearnsolutions@gmail.com" 
              className="contact-btn bg-[#00225c] hover:bg-[#001a4a] text-white px-8 py-4 rounded-full text-lg transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm"
            >
              Shoot a Mail
            </a>
            <a 
              href="https://wa.me/919347055962" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-btn bg-[#00225c] hover:bg-[#001a4a] text-white px-8 py-4 rounded-full text-lg transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
