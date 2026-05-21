import React from 'react';
import CodingRoundQuestionFormWrapper from './forms/CodingRoundQuestionFormWrapper';
import McqRoundQuestionFormWrapper from './forms/McqRoundQuestionFormWrapper';
import NotesQuestionFormWrapper from './forms/NotesQuestionFormWrapper';

export const DynamicQuestionFormHost = ({
  categoryType,
  formData,
  onChange,
  onTestCaseChange,
  onAddTestCase,
  onRemoveTestCase,
  onMcqOptionChange,
  expandedSections,
  onToggleSection,
}) => {
  switch (categoryType) {
    case 'Coding':
      return (
        <CodingRoundQuestionFormWrapper
          formData={formData}
          onChange={onChange}
          onTestCaseChange={onTestCaseChange}
          onAddTestCase={onAddTestCase}
          onRemoveTestCase={onRemoveTestCase}
          expandedSections={expandedSections}
          onToggleSection={onToggleSection}
        />
      );
    case 'MCQ':
      return (
        <McqRoundQuestionFormWrapper
          formData={formData}
          onChange={onChange}
          onMcqOptionChange={onMcqOptionChange}
        />
      );
    case 'Notes':
      return (
        <NotesQuestionFormWrapper
          formData={formData}
          onChange={onChange}
        />
      );
    default:
      return (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200">
          Unsupported category type: {categoryType}
        </div>
      );
  }
};

export default DynamicQuestionFormHost;
