import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const FloatingCourseLogos = () => {
  const [courseLogos, setCourseLogos] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  // Available course logos with their assets - only technical programming courses
  const availableCourses = [
    { id: 1, title: "Java Programming", image: "/java.png", icon: "☕" },
    { id: 2, title: "Python Programming", image: "/python.png", icon: "🐍" },
    { id: 3, title: "HTML", image: "/html.png", icon: "🌐" },
    { id: 4, title: "CSS", image: "/css.png", icon: "🎨" },
    { id: 5, title: "JavaScript", image: "/js.png", icon: "⚡" },
    { id: 6, title: "C Programming", image: "/c.png", icon: "🔧" },
    { id: 7, title: "C++", image: "/c.png", icon: "⚙️" },
    { id: 8, title: "Data Structures", image: "/dsa.png", icon: "🧠" },
    { id: 9, title: "MySQL Database", image: "/mysql.png", icon: "🗄️" },
    { id: 10, title: "React", image: null, icon: "⚛️" },
    { id: 11, title: "Node.js", image: null, icon: "💚" },
    { id: 12, title: "Git", image: null, icon: "📚" },
  ];

  // Generate random positions for course logos within hero section container, avoiding text areas
  const generateRandomPosition = () => {
    const container = containerRef.current;
    if (!container) {
      // Fallback if container not available yet
      const padding = 100;
      return {
        x: Math.random() * (window.innerWidth - padding * 2) + padding,
        y: Math.random() * (window.innerHeight - padding * 2) + padding,
      };
    }

    const rect = container.getBoundingClientRect();
    const padding = 80; // Padding from container edges

    // Define exclusion zones to avoid text and buttons
    const exclusionZones = [
      // Main text area (center of screen)
      {
        x: rect.width * 0.2, // 20% from left
        y: rect.height * 0.3, // 30% from top
        width: rect.width * 0.6, // 60% of container width
        height: rect.height * 0.4, // 40% of container height
      },
      // Button area (bottom center)
      {
        x: rect.width * 0.3, // 30% from left
        y: rect.height * 0.75, // 75% from top
        width: rect.width * 0.4, // 40% of container width
        height: rect.height * 0.15, // 15% of container height
      }
    ];

    // Function to check if a position overlaps with exclusion zones
    const isPositionValid = (x, y) => {
      return !exclusionZones.some(zone =>
        x >= zone.x && x <= zone.x + zone.width &&
        y >= zone.y && y <= zone.y + zone.height
      );
    };

    // Try to find a valid position (max 50 attempts)
    let attempts = 0;
    let position;

    do {
      position = {
        x: Math.random() * (rect.width - padding * 2) + padding,
        y: Math.random() * (rect.height - padding * 2) + padding,
      };
      attempts++;
    } while (!isPositionValid(position.x, position.y) && attempts < 50);

    return position;
  };

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize floating course logos
  useEffect(() => {
    const initializeLogos = () => {
      // Adjust logo count based on device type
      const logoCount = isMobile ?
        Math.min(6, availableCourses.length) : // Fewer logos on mobile
        Math.min(10, availableCourses.length); // Moderate count for hero section
      const initialLogos = [];

      for (let i = 0; i < logoCount; i++) {
        const course = availableCourses[i % availableCourses.length];
        const position = generateRandomPosition();
        
        initialLogos.push({
          id: `logo-${i}`,
          ...course,
          x: position.x,
          y: position.y,
          originalX: position.x,
          originalY: position.y,
          scale: isMobile ?
            0.6 + Math.random() * 0.3 : // Smaller on mobile
            0.8 + Math.random() * 0.4,   // Normal size on desktop
          rotation: Math.random() * 360,
          animationDelay: Math.random() * 2,
        });
      }

      setCourseLogos(initialLogos);
    };

    initializeLogos();

    // Reinitialize on window resize
    const handleResize = () => {
      initializeLogos();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Track mouse position relative to hero section container (desktop only)
  useEffect(() => {
    if (isMobile) return; // Skip mouse tracking on mobile

    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        // Check if mouse is within the container bounds
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
        } else {
          // Mouse is outside hero section, disable runaway effect
          setMousePosition({ x: -1000, y: -1000 });
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Calculate distance between two points
  const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Calculate runaway position for a logo, avoiding text areas
  const calculateRunawayPosition = (logo) => {
    const distance = calculateDistance(logo.x, logo.y, mousePosition.x, mousePosition.y);
    const runawayThreshold = 150; // Distance at which logos start running away

    if (distance < runawayThreshold && distance > 0) {
      // Calculate direction away from mouse
      const angle = Math.atan2(logo.y - mousePosition.y, logo.x - mousePosition.x);
      const runawayDistance = (runawayThreshold - distance) * 0.5; // Intensity of runaway

      let newX = logo.x + Math.cos(angle) * runawayDistance;
      let newY = logo.y + Math.sin(angle) * runawayDistance;

      // Keep within container bounds and avoid text areas
      const container = containerRef.current;
      const padding = 50;
      if (container) {
        const rect = container.getBoundingClientRect();

        // Define exclusion zones (same as in generateRandomPosition)
        const exclusionZones = [
          {
            x: rect.width * 0.2,
            y: rect.height * 0.3,
            width: rect.width * 0.6,
            height: rect.height * 0.4,
          },
          {
            x: rect.width * 0.3,
            y: rect.height * 0.75,
            width: rect.width * 0.4,
            height: rect.height * 0.15,
          }
        ];

        // Check if new position would be in exclusion zone
        const isInExclusionZone = exclusionZones.some(zone =>
          newX >= zone.x && newX <= zone.x + zone.width &&
          newY >= zone.y && newY <= zone.y + zone.height
        );

        // If in exclusion zone, push further away or use original position
        if (isInExclusionZone) {
          // Try pushing further in the same direction
          newX = logo.x + Math.cos(angle) * runawayDistance * 2;
          newY = logo.y + Math.sin(angle) * runawayDistance * 2;

          // If still in exclusion zone, revert to original position
          const stillInExclusionZone = exclusionZones.some(zone =>
            newX >= zone.x && newX <= zone.x + zone.width &&
            newY >= zone.y && newY <= zone.y + zone.height
          );

          if (stillInExclusionZone) {
            return { x: logo.originalX, y: logo.originalY };
          }
        }

        const boundedX = Math.max(padding, Math.min(rect.width - padding, newX));
        const boundedY = Math.max(padding, Math.min(rect.height - padding, newY));
        return { x: boundedX, y: boundedY };
      }

      // Fallback to window bounds
      const boundedX = Math.max(padding, Math.min(window.innerWidth - padding, newX));
      const boundedY = Math.max(padding, Math.min(window.innerHeight - padding, newY));

      return { x: boundedX, y: boundedY };
    }

    // Slowly return to original position when mouse is far away
    const returnSpeed = 0.02;
    const returnX = logo.x + (logo.originalX - logo.x) * returnSpeed;
    const returnY = logo.y + (logo.originalY - logo.y) * returnSpeed;

    return { x: returnX, y: returnY };
  };

  // Update logo positions based on mouse position (desktop only)
  useEffect(() => {
    if (courseLogos.length === 0 || isMobile) return; // Skip position updates on mobile

    const updatePositions = () => {
      setCourseLogos(prevLogos =>
        prevLogos.map(logo => {
          const newPosition = calculateRunawayPosition(logo);
          return {
            ...logo,
            x: newPosition.x,
            y: newPosition.y,
          };
        })
      );
    };

    const animationFrame = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrame);
  }, [mousePosition, courseLogos.length, isMobile]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
    >
      {courseLogos.map((logo) => (
        <motion.div
          key={logo.id}
          className="absolute pointer-events-none"
          style={{
            left: logo.x - (isMobile ? 20 : 28), // Center the logo based on new sizes
            top: logo.y - (isMobile ? 20 : 28),  // Center the logo based on new sizes
          }}
          animate={isMobile ? {
            // Mobile: Simple up and down floating animation
            y: [0, -15, 0],
            scale: [logo.scale, logo.scale * 1.05, logo.scale],
          } : {
            // Desktop: Scale and rotate animation
            scale: [logo.scale, logo.scale * 1.1, logo.scale],
            rotate: [logo.rotation, logo.rotation + 10, logo.rotation],
          }}
          transition={{
            duration: isMobile ? 4 + Math.random() * 2 : 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: logo.animationDelay,
          }}
        >
          {logo.image ? (
            <img
              src={logo.image}
              alt={`${logo.title} logo`}
              className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} object-contain filter drop-shadow-lg hover:drop-shadow-xl transition-all duration-300`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : (
            <div
              className={`${isMobile ? 'text-2xl' : 'text-3xl'} filter drop-shadow-lg hover:drop-shadow-xl transition-all duration-300`}
            >
              {logo.icon}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingCourseLogos;
