import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const coreCsQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'Core CS');

export default function CoreCsQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="Core CS Questions"
      pageSubtitle="Practice and track your progress across topics."
      questions={coreCsQuestions}
      lockedTopic="Core CS"
      showTopicFilter={false}
      activeCategory="core-cs"
    />
  );
}
