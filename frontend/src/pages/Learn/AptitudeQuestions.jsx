import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const aptitudeQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'Aptitude');

export default function AptitudeQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="Aptitude Questions"
      pageSubtitle="Practice aptitude questions and track your progress."
      questions={aptitudeQuestions}
      lockedTopic="Aptitude"
      showTopicFilter={false}
    />
  );
}
