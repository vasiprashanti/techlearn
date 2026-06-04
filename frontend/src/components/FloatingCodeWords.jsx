import React, { useEffect, useRef } from 'react'

const FloatingCodeWords = () => {
  const codeSnippets = [
    "console.log('You got this!');",
    "alert('Keep coding!');",
    "success = true;",
    "return 'Dream big!';",
    "commit -m 'Growth'",
    "push('Hard work');",
    "while(!success) keepTrying();",
    "def future(): return 'Bright'",
    "try { newChallenge(); } catch { Learn(); }",
    "const motivation = Infinity;",
    "import happiness from 'life';",
    "keepGoing(); // Always!",
    "let progress = ++you;",
    "new Day().new Opportunity();",
    "System.out.println('Keep shining!');",
    "SELECT * FROM life WHERE happy = true;",
    "stayPositive(); // Always works!",
    "npm install confidence",
    "startJourney(); // Begin!",
    "smile++; // Every day"
  ]

  const occupiedColumns = useRef({})

  useEffect(() => {
    const isMobile = window.innerWidth <= 768

    const createSnippet = () => {
      const snippet = document.createElement("span")
      snippet.classList.add("code-snippet")
      snippet.innerText = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]

      // Force fixed positioning relative to viewport so scrolling/document height doesn't clip it
      snippet.style.position = 'fixed'
      snippet.style.top = '-5%'
      
      // Override animation to run exactly once (forwards) over 1.5 seconds for a faster fall
      snippet.style.animation = 'float-down 1.5s linear forwards'

      // Calculate boundaries to prevent text leaking off left/right edges
      const padding = isMobile ? 70 : 130
      const viewportWidth = window.innerWidth
      const spawnWidth = Math.max(100, viewportWidth - 2 * padding)
      
      // Dynamic lane width based on device screen size
      const laneWidth = isMobile ? 110 : 180
      const numCols = Math.max(1, Math.floor(spawnWidth / laneWidth))
      const colWidth = spawnWidth / numCols

      const now = Date.now()
      const availableCols = []

      // Check which columns are free, blocking adjacent columns to prevent horizontal overlapping
      for (let i = 0; i < numCols; i++) {
        let isOccupied = false
        const neighbors = [i - 1, i, i + 1]
        for (const col of neighbors) {
          if (col >= 0 && col < numCols) {
            const lastSpawn = occupiedColumns.current[col] || 0
            // Cooldown blocks spawning too close vertically in/around this lane
            if (now - lastSpawn < 600) {
              isOccupied = true
              break
            }
          }
        }
        if (!isOccupied) {
          availableCols.push(i)
        }
      }

      let chosenCol
      if (availableCols.length > 0) {
        chosenCol = availableCols[Math.floor(Math.random() * availableCols.length)]
      } else {
        // Fallback to the lane that has been idle the longest
        let oldestTime = Infinity
        let oldestCol = 0
        for (let i = 0; i < numCols; i++) {
          const lastSpawn = occupiedColumns.current[i] || 0
          if (lastSpawn < oldestTime) {
            oldestTime = lastSpawn
            oldestCol = i
          }
        }
        chosenCol = oldestCol
      }

      // Mark the selected column as occupied
      occupiedColumns.current[chosenCol] = now

      // Calculate horizontal position centered inside the chosen column
      const leftPos = padding + (chosenCol + 0.5) * colWidth
      snippet.style.left = `${leftPos}px`

      document.body.appendChild(snippet)

      // Remove snippet only after the 1.5s float-down animation completes off-screen
      setTimeout(() => {
        if (snippet.parentNode) {
          snippet.remove()
        }
      }, 1600)
    }

    // Set spawn interval: slower on mobile, comfortable on desktop
    const spawnInterval = isMobile ? 1000 : 500
    const interval = setInterval(createSnippet, spawnInterval)

    return () => {
      clearInterval(interval)
      const existingSnippets = document.querySelectorAll('.code-snippet')
      existingSnippets.forEach(snippet => snippet.remove())
    }
  }, [])

  return null
}

export default FloatingCodeWords
