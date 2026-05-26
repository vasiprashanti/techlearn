import { useLocation } from 'react-router-dom';
import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

export default function InterviewQuestions() {
  const location = useLocation();
  const isDashboardPractice = location.pathname.startsWith('/dashboard/practice');

  return (
    <QuestionCatalogPage
      pageTitle={isDashboardPractice ? 'Practice' : 'All Interview Questions'}
      pageSubtitle={
        isDashboardPractice
          ? 'Choose DSA, SQL, Core CS, or Aptitude and keep your placement practice focused.'
          : 'Practice and track your progress across topics.'
      }
      questions={interviewQuestionsCatalog}
    />
  );
}
