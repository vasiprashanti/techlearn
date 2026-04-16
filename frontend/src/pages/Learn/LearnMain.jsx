import HeroSection from '../../components/HeroSection'
import ScrollProgress from '../../components/ScrollProgress'
import Courses from './Courses'

const LearnMain = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ScrollProgress />
      <HeroSection />
      <Courses />
    </div>
  )
}

export default LearnMain
