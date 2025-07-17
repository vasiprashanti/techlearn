import { motion } from "framer-motion";

// 3D Courses Model - Floating Books and Laptop
export const CoursesModel = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Laptop */}
      <motion.div
        className="relative z-10"
        animate={{ 
          rotateY: [0, 5, 0, -5, 0],
          y: [0, -10, 0, -5, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="w-48 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-2xl transform rotate-x-12 perspective-1000">
          {/* Screen */}
          <div className="w-full h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg p-2">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded flex items-center justify-center">
              <div className="text-white text-xs font-bold">Interactive Learning</div>
            </div>
          </div>
          {/* Keyboard */}
          <div className="w-full h-8 bg-slate-700 rounded-b-lg flex items-center justify-center">
            <div className="w-16 h-1 bg-slate-600 rounded"></div>
          </div>
        </div>
      </motion.div>

      {/* Floating Books */}
      <motion.div
        className="absolute top-8 left-8 w-12 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded shadow-lg transform rotate-12"
        animate={{ 
          y: [0, -15, 0],
          rotateZ: [12, 20, 12]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <div className="w-full h-2 bg-emerald-700 rounded-t"></div>
      </motion.div>

      <motion.div
        className="absolute bottom-12 right-8 w-10 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded shadow-lg transform -rotate-12"
        animate={{ 
          y: [0, -12, 0],
          rotateZ: [-12, -20, -12]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      >
        <div className="w-full h-2 bg-purple-700 rounded-t"></div>
      </motion.div>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.6, 1, 0.6],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3
          }}
        />
      ))}
    </div>
  );
};

// 3D Challenges Model - Code Blocks and Puzzle Pieces
export const ChallengesModel = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Code Block */}
      <motion.div
        className="relative z-10 w-40 h-32 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl p-4"
        animate={{ 
          rotateY: [0, 8, 0, -8, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        {/* Code Lines */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded"></div>
            <div className="w-16 h-1 bg-purple-400 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded"></div>
            <div className="w-20 h-1 bg-green-400 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded"></div>
            <div className="w-12 h-1 bg-blue-400 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded"></div>
            <div className="w-18 h-1 bg-yellow-400 rounded"></div>
          </div>
        </div>
      </motion.div>

      {/* Floating Puzzle Pieces */}
      <motion.div
        className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg shadow-lg"
        animate={{ 
          y: [0, -18, 0],
          rotateZ: [0, 15, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.3
        }}
      >
        {/* Puzzle notch */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-pink-500 rounded-full"></div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-6 w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg shadow-lg"
        animate={{ 
          y: [0, -15, 0],
          rotateZ: [0, -12, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      >
        {/* Puzzle notch */}
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-cyan-500 rounded-full"></div>
      </motion.div>

      {/* Binary Rain Effect */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-green-400 text-xs font-mono opacity-70"
          style={{
            left: `${15 + i * 10}%`,
            top: `${10 + (i % 4) * 20}%`,
          }}
          animate={{
            y: [0, 30, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.2
          }}
        >
          {Math.random() > 0.5 ? '1' : '0'}
        </motion.div>
      ))}
    </div>
  );
};

// 3D Certification Model - Trophy and Certificate
export const CertificationModel = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Trophy */}
      <motion.div
        className="relative z-10"
        animate={{ 
          rotateY: [0, 10, 0, -10, 0],
          y: [0, -8, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        {/* Trophy Cup */}
        <div className="w-24 h-32 relative">
          {/* Cup Body */}
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg mx-auto shadow-2xl">
            <div className="w-full h-4 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-t-lg"></div>
            {/* Handles */}
            <div className="absolute top-2 -left-2 w-4 h-8 border-4 border-yellow-500 rounded-full"></div>
            <div className="absolute top-2 -right-2 w-4 h-8 border-4 border-yellow-500 rounded-full"></div>
          </div>
          {/* Base */}
          <div className="w-24 h-6 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded mx-auto -mt-2"></div>
          <div className="w-28 h-4 bg-gradient-to-br from-yellow-700 to-yellow-900 rounded mx-auto -mt-1"></div>
        </div>
      </motion.div>

      {/* Floating Certificate */}
      <motion.div
        className="absolute top-8 right-4 w-16 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded shadow-lg transform rotate-12"
        animate={{ 
          y: [0, -12, 0],
          rotateZ: [12, 20, 12]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <div className="w-full h-2 bg-blue-600 rounded-t"></div>
        <div className="p-1">
          <div className="w-full h-1 bg-blue-300 rounded mb-1"></div>
          <div className="w-3/4 h-1 bg-blue-300 rounded mb-1"></div>
          <div className="w-1/2 h-1 bg-blue-300 rounded"></div>
        </div>
      </motion.div>

      {/* Floating Badge */}
      <motion.div
        className="absolute bottom-12 left-4 w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg flex items-center justify-center"
        animate={{ 
          y: [0, -15, 0],
          rotateZ: [0, -15, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      >
        <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
        </div>
      </motion.div>

      {/* Sparkle Effects */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          style={{
            left: `${20 + i * 8}%`,
            top: `${15 + (i % 5) * 15}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};

// 3D Membership Model - Crown and Premium Elements
export const MembershipModel = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main Crown */}
      <motion.div
        className="relative z-10"
        animate={{
          rotateY: [0, 10, 0, -10, 0],
          y: [0, -8, 0, -4, 0]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-32 h-24 relative">
          {/* Crown Base */}
          <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg shadow-xl">
            <div className="w-full h-2 bg-yellow-600 rounded-t-lg"></div>
          </div>

          {/* Crown Points */}
          <div className="absolute bottom-6 w-full flex justify-between items-end">
            <div className="w-4 h-8 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-full shadow-lg"></div>
            <div className="w-6 h-12 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-full shadow-lg"></div>
            <div className="w-8 h-16 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-full shadow-lg"></div>
            <div className="w-6 h-12 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-full shadow-lg"></div>
            <div className="w-4 h-8 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-full shadow-lg"></div>
          </div>

          {/* Crown Gems */}
          <motion.div
            className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* Floating Premium Badges */}
      <motion.div
        className="absolute top-4 right-8 w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg flex items-center justify-center"
        animate={{
          y: [0, -12, 0],
          rotateZ: [0, 15, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      >
        <div className="w-3 h-3 bg-white rounded-full"></div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-4 w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded shadow-lg"
        animate={{
          y: [0, -8, 0],
          rotateZ: [0, -10, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
      />

      {/* Sparkle Effects */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-300 rounded-full"
          style={{
            top: `${20 + i * 10}%`,
            left: `${15 + i * 12}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3
          }}
        />
      ))}
    </div>
  );
};
