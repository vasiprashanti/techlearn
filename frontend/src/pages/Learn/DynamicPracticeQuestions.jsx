import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import QuestionCatalogPage from '../../components/QuestionCatalogPage';

export default function DynamicPracticeQuestions() {
  const { categorySlug } = useParams();
  const location = useLocation();
  const state = location.state || {};

  // Formulate a user-friendly title from the slug, e.g., "web-development" -> "Web Development"
  const formattedTitle = categorySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const pageTitle = state.title || formattedTitle;

  return (
    <QuestionCatalogPage
      pageTitle={pageTitle}
      pageSubtitle="Practice and track your progress across topics."
      questions={[]}
      lockedTopic={categorySlug} // Pass the slug, backend now supports matching by slug!
      showTopicFilter={false}
    />
  );
}
