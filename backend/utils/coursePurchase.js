export const buildCapturedCoursePurchaseQuery = ({ userId, courseId }) => ({
  userId,
  courseId,
  paymentPurpose: "CoursePurchase",
  status: "captured",
});

export const isCoursePurchasePayment = (payment) => Boolean(
  payment?.paymentPurpose === "CoursePurchase" && payment?.courseId
);

export const isPaidCourseAvailableForPurchase = (course) => Boolean(
  course?.status === "Published"
  && course?.accessType === "Paid"
  && Number.isFinite(Number(course?.price))
  && Number(course.price) > 0
  && Array.isArray(course?.topicIds)
  && course.topicIds.length > 0
);
