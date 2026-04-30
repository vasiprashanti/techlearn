import useInViewport from "../hooks/useInViewport";

const HeroSection = () => {
  const [titleRef, isTitleInViewport] = useInViewport();
  const [subtitleRef, isSubtitleInViewport] = useInViewport();
  const [descriptionRef, isDescriptionInViewport] = useInViewport();

  return (
    <div className="relative z-10 bg-[var(--tl-sky-50)] dark:bg-[var(--tl-sky-100)] backdrop-blur-xl border-b border-[var(--tl-sky-200)] dark:border-[var(--tl-sky-400)] overflow-hidden pt-20">
      <div className="container px-4 py-12 mx-auto max-w-7xl relative z-20">
        <div className="grid lg:grid-cols-[2fr_1fr] gap-12 items-center min-h-[480px]">
          {/* Left Content */}
          <div className="relative z-10 text-left lg:text-left">
            <h1 className="font-poppins text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-medium tracking-tight mb-6 leading-[1.1] overflow-visible">
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

            {/* Warning Text */}
            <p
              ref={descriptionRef}
              className={`font-poppins text-sm sm:text-base md:text-lg lg:text-xl text-[var(--tl-navy-800)] dark:text-[var(--tl-sky-600)] hover-gradient-text max-w-full break-words ${
                isDescriptionInViewport ? "in-viewport" : ""
              }`}
            >
              Warning: Coding skills may cause sudden job offers and inflated Git pushes.
            </p>
          </div>

          {/* Right Side - Book Animation */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative transition-transform duration-300 hover:scale-105 hover:rotate-[5deg]">
              <img
                src="/book.gif"
                alt="Learning Books Animation"
                className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain filter drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
