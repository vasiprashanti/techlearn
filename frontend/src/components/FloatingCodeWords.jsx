import React, { useEffect } from 'react'

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

  useEffect(() => {
    const createSnippet = () => {
      const snippet = document.createElement("span")
      snippet.classList.add("code-snippet")
      snippet.innerText = codeSnippets[Math.floor(Math.random() * codeSnippets.length)]

      // Spawn at a random horizontal position within the viewport
      snippet.style.left = Math.random() * window.innerWidth + "px"

      document.body.appendChild(snippet)

      // Remove snippet after animation ends
      setTimeout(() => {
        if (snippet.parentNode) {
          snippet.remove()
        }
      }, 5000)
    }

    // Generate new snippets every 1.5s
    const interval = setInterval(createSnippet, 1500)

    return () => {
      clearInterval(interval)
      // Clean up any remaining snippets
      const existingSnippets = document.querySelectorAll('.code-snippet')
      existingSnippets.forEach(snippet => snippet.remove())
    }
  }, [])

  return null // This component doesn't render anything directly
}

export default FloatingCodeWords
