import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const coreCsQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'Core CS');

export default function CoreCsQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="Core CS Questions"
      pageSubtitle="Practice core computer science questions and track progress."
      questions={coreCsQuestions}
      lockedTopic="Core CS"
      showTopicFilter={false}
    />
  );
}
