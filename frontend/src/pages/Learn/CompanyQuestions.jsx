import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const companyQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'Company');

export default function CompanyQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="Company Questions"
      pageSubtitle="Practice questions asked in top tech company interviews."
      questions={companyQuestions}
      lockedTopic="Company"
      showTopicFilter={false}
    />
  );
}
