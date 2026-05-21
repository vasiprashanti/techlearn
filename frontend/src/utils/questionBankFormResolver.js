export const QUESTION_BANK_CATEGORY_TYPES = ['Coding', 'MCQ', 'Notes'];

export const normalizeQuestionBankCategoryType = (value = '') => {
  const normalized = String(value).trim();
  return QUESTION_BANK_CATEGORY_TYPES.includes(normalized) ? normalized : 'Coding';
};

export const resolveQuestionBankFormMode = (categoryType) => {
  const normalizedType = normalizeQuestionBankCategoryType(categoryType);

  return {
    categoryType: normalizedType,
    isCodingCategory: normalizedType === 'Coding',
    isMcqCategory: normalizedType === 'MCQ',
    isNotesCategory: normalizedType === 'Notes',
    formLabel:
      normalizedType === 'Coding'
        ? 'Coding Round form'
        : normalizedType === 'MCQ'
          ? 'MCQ Round form'
          : 'Markdown / Notes form',
  };
};

export default resolveQuestionBankFormMode;
