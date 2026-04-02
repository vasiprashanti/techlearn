import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const dsaQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'DSA');

export default function DsaQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="DSA Questions"
      pageSubtitle="Practice and track your progress across topics."
      questions={dsaQuestions}
      lockedTopic="DSA"
      showTopicFilter={false}
    />
  );
}
