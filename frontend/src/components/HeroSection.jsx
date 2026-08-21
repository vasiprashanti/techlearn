import useInViewport from "../hooks/useInViewport";

const HeroSection = () => {
  const [titleRef, isTitleInViewport] = useInViewport();
  const [subtitleRef, isSubtitleInViewport] = useInViewport();
  const [descriptionRef, isDescriptionInViewport] = useInViewport();

  return (
    <div className="relative z-10 bg-transparent overflow-hidden min-h-[calc(100vh-4rem)] sm:min-h-screen flex items-center justify-center pt-16 pb-12">
      <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 md:px-12 lg:px-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr] gap-8 sm:gap-12 items-center">
          {/* Left Content */}
          <div className="relative z-10 text-left">
            <h1 className="font-press-start text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tight mb-6 leading-[1.4] overflow-visible">
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
              className={`text-[11px] sm:text-xs md:text-sm tracking-[0.1em] sm:tracking-[0.2em] uppercase text-[#00113b] dark:text-[#7fb9e6] mt-4 font-semibold ${
                isDescriptionInViewport ? "in-viewport" : ""
              }`}
            >
              Whether you're starting out or upskilling,<br className="hidden sm:inline" /> we've got a course for you.
            </p>
          </div>

          {/* Right Side - Book Animation */}
          <div className="relative flex items-center justify-center md:justify-end">
            <div className="relative transition-transform duration-300 hover:scale-105 hover:rotate-[5deg] w-full flex justify-center md:justify-end">
              <img
                src="/book-optimized.webp"
                alt="Learning Books Animation"
                className="w-full max-w-[12rem] sm:max-w-[16rem] md:max-w-[20rem] lg:max-w-[24rem] object-contain filter drop-shadow-2xl"
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
