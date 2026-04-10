import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const sqlQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'SQL');

export default function SqlQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="SQL Questions"
      pageSubtitle="Practice and track your progress across topics."
      questions={sqlQuestions}
      lockedTopic="SQL"
      showTopicFilter={false}
    />
  );
}
