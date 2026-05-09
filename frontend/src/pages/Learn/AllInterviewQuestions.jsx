import { useEffect, useState } from 'react';
import QuestionCatalogPage from '../../components/QuestionCatalogPage';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import { practiceAPI } from '../../services/api';

export default function InterviewQuestions() {
  const [practiceStats, setPracticeStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    practiceAPI
      .getStats()
      .then((response) => {
        if (!isMounted) return;
        setPracticeStats(response?.data || null);
        setStatsError('');
      })
      .catch((error) => {
        if (!isMounted) return;
        setStatsError(error?.message || 'Failed to load practice stats.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <QuestionCatalogPage
      pageTitle="All Interview Questions"
      pageSubtitle="Practice and track your progress across topics."
      questions={interviewQuestionsCatalog}
      practiceStats={practiceStats}
      practiceStatsLoading={isLoading}
      practiceStatsError={statsError}
    />
  );
}
