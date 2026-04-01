import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const companyQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'Company');

export default function CompanyQuestions() {
  return (
    <QuestionCatalogPage
      pageTitle="Company-Based Questions"
      pageSubtitle="Practice and track your progress across topics."
      questions={companyQuestions}
      lockedTopic="Company"
      showTopicFilter={false}
      activeCategory="company"
    />
  );
}
