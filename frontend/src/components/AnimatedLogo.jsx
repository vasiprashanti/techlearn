import { motion } from "framer-motion";

const AnimatedLogo = ({ src, alt, className = "w-20 h-20", fallbackIcon = "📚" }) => {
  return (
    <motion.div
      className="relative z-10 flex items-center justify-center"
      animate={{
        scale: [1, 1.05, 1]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 }
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${className} object-contain`}
          loading="lazy"
          onError={(e) => {
            // Fallback to emoji icon if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
      ) : null}
      <div
        className="text-6xl hidden"
        style={{ display: src ? 'none' : 'block' }}
      >
        {fallbackIcon}
      </div>
    </motion.div>
  );
};

export default AnimatedLogo;
