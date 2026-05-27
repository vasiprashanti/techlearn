import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

export default function InterviewQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="PRACTICE QUESTIONS"
      pageSubtitle="Practice and track your progress across topics."
      questions={interviewQuestionsCatalog}
    />
  );
}
