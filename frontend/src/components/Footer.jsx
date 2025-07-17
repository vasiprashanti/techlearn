import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-[#00113b] text-white text-center pt-16 px-8 pb-0 w-full relative z-10 overflow-hidden -mt-10 md:-mt-1">
      {/* Top Section with Centered Columns */}
      <div className="pb-56 flex flex-col items-center">
        <div className="w-full max-w-5xl flex flex-col md:flex-row justify-center items-center md:items-start md:space-x-32 text-center md:text-left space-y-8 md:space-y-0">
          {/* CONNECT Section */}
          <div className="flex-1 w-full">
            <h3 className="font-bold text-white mb-4 text-lg uppercase tracking-wide">CONNECT</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.youtube.com/@techlearnsolutions8014"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919676663136?text=Hi%20there!%20I%20want%20to%20know%20more%20about%20your%20courses"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/techlearn_in/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* LEARN Section */}
          <div className="flex-1 w-full">
            <h3 className="font-bold text-white mb-4 text-lg uppercase tracking-wide">LEARN</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/courses"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  Paid Courses
                </Link>
              </li>
              <li>
                <Link
                  to="/resources"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  Free Resources
                </Link>
              </li>
              <li>
                <Link
                  to="/blogs"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY Section */}
          <div className="flex-1 w-full">
            <h3 className="font-bold text-white mb-4 text-lg uppercase tracking-wide">COMPANY</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-white text-base transition-colors duration-300"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Logo Section - Full width on desktop, contained on mobile */}
      <div className="absolute bottom-0 left-0 w-full pointer-events-none select-none px-4 sm:px-0">
        <img
          src="/logo-no-bg.jpg"
          alt="TechLearn Solutions"
          className="w-full max-w-full h-12 object-contain sm:h-32 md:h-56 sm:object-cover object-bottom"
          draggable="false"
        />
      </div>
    </footer>
  )
}

export default Footer
