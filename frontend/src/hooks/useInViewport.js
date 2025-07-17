import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect when an element is in the viewport
 * Enhanced with animation states and reduced motion support
 */
const useInViewport = (options = {}) => {
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsInViewport(true);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInViewport(true);
          setHasAnimated(true);
        } else if (!entry.isIntersecting) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: '0px 0px -5% 0px', // Trigger slightly before element is fully visible
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasAnimated, options]);

  return [elementRef, isInViewport, hasAnimated];
};

export default useInViewport;
