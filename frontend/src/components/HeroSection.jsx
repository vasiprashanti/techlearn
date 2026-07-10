import useInViewport from "../hooks/useInViewport";

const HeroSection = () => {
  const [titleRef, isTitleInViewport] = useInViewport();
  const [subtitleRef, isSubtitleInViewport] = useInViewport();
  const [descriptionRef, isDescriptionInViewport] = useInViewport();

  return (
    <div className="relative z-10 bg-transparent overflow-hidden pt-20">
      <div className="container px-4 py-12 mx-auto max-w-7xl relative z-20">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-12 items-center min-h-[480px]">
          {/* Left Content */}
          <div className="relative z-10 text-left lg:text-left">
            <h1 className="font-press-start text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6 leading-[1.4] overflow-visible">
              <span
                ref={titleRef}
                className={`brand-heading-primary hover-gradient-text italic pr-2 ${
                  isTitleInViewport ? "in-viewport" : ""
                }`}
                style={{ display: "inline-block" }}
              >
                learn
              </span>
              <br />
              <span
                ref={subtitleRef}
                className={`brand-heading-secondary hover-gradient-text ${
                  isSubtitleInViewport ? "in-viewport" : ""
                }`}
              >
                CODING
              </span>
            </h1>

            {/* Subheading */}
            <p
              ref={descriptionRef}
              className={`text-[11px] sm:text-xs md:text-sm tracking-[0.2em] uppercase text-[#00113b] dark:text-[#7fb9e6] mt-4 font-semibold ${
                isDescriptionInViewport ? "in-viewport" : ""
              }`}
            >
              Whether you're starting out or upskilling, we've got a course for you.
            </p>
          </div>

          {/* Right Side - Book Animation */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative transition-transform duration-300 hover:scale-105 hover:rotate-[5deg]">
              <img
                src="/book-optimized.webp"
                alt="Learning Books Animation"
                className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain filter drop-shadow-2xl"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
