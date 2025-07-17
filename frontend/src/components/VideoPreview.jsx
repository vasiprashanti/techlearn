import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { useState, useRef } from "react";

// Video Preview Component for Screen Recordings
export const VideoPreview = ({ section }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getVideoSource = () => {
    switch(section.id) {
      case 'courses':
        return '/videos/courses-preview.mp4'; // Screen recording of courses page
      case 'exercises':
        return '/videos/exercises-preview.mp4'; // Screen recording of compiler
      case 'certification':
        return '/videos/certificate-preview.mp4'; // Masked certificate video
      default:
        return null;
    }
  };

  const getPlaceholderContent = () => {
    switch(section.id) {
      case 'courses':
        return {
          title: "Courses Preview",
          description: "Record: Scrolling through courses, opening notes, taking quiz, live batches card"
        };
      case 'exercises':
        return {
          title: "Compiler Preview", 
          description: "Record: Hello World program typing and submission"
        };
      case 'certification':
        return {
          title: "Certificate Preview",
          description: "Use masked version of actual certificate"
        };
      default:
        return { title: "Preview", description: "Coming soon" };
    }
  };

  const placeholder = getPlaceholderContent();
  const videoSrc = getVideoSource();

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        className="relative w-full max-w-md h-64 sm:h-80 md:h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        animate={{ 
          rotateY: [0, 2, 0, -2, 0],
          y: [0, -5, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Video Element (when available) */}
        {videoSrc ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          /* Placeholder Content */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{placeholder.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{placeholder.description}</p>
          </div>
        )}

        {/* Play/Pause Overlay */}
        <motion.div
          className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${
            isHovered || !videoSrc ? 'opacity-100' : 'opacity-0'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered || !videoSrc ? 1 : 0 }}
        >
          {videoSrc && (
            <motion.button
              onClick={handlePlayPause}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </motion.button>
          )}
        </motion.div>

        {/* Recording Instructions Overlay (for placeholder) */}
        {!videoSrc && (
          <div className="absolute top-4 right-4">
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              RECORD
            </div>
          </div>
        )}

        {/* Subtle border glow effect */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
      </motion.div>

      {/* Floating elements for visual interest */}
      <motion.div
        className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-60"
        animate={{ 
          y: [0, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      <motion.div
        className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-60"
        animate={{ 
          y: [0, 10, 0],
          scale: [1, 0.9, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      />
    </div>
  );
};

export default VideoPreview;
