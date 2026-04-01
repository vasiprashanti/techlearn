import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

export default function InterviewQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="All Interview Questions"
      pageSubtitle="Practice and track your progress across topics."
      questions={interviewQuestionsCatalog}
      activeCategory="all"
    />
  );
}
