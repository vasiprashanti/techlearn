import HeroSection from '../../components/HeroSection'
import SectionsList from '../../components/SectionsList'
import ScrollProgress from '../../components/ScrollProgress'

const LearnMain = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Header Section with enhanced styling */}
      <HeroSection />

      {/* Main Content with enhanced cards */}
      <SectionsList />
    </div>
  )
}

export default LearnMain
