import Payment from "../models/Payment.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sameCalendarAnchor = (left, right) => {
  const a = validDate(left);
  const b = validDate(right);
  return Boolean(a && b && Math.abs(a.getTime() - b.getTime()) <= DAY_MS);
};

/**
 * Conservatively identify migrated enrollments whose individual date was
 * copied from record creation. Explicit admin/payment dates are always left
 * untouched. A date is reconciled only when it is still anchored to
 * createdAt/assignedAt and an older authoritative date is available.
 */
export const resolveSafeLegacyIndividualStartDate = async ({ enrollment, user, student }) => {
  const currentDate = validDate(enrollment?.individualStartDate);
  if (!currentDate) return { date: null, reconciled: false, reason: "invalid_current_date" };

  const source = String(enrollment?.individualStartDateSource || "").trim();
  if (source && source !== "legacy_inferred") {
    return { date: currentDate, reconciled: false, reason: "explicit_or_known_source" };
  }

  const looksMigrated = sameCalendarAnchor(currentDate, enrollment?.createdAt)
    || sameCalendarAnchor(currentDate, enrollment?.assignedAt);
  if (!looksMigrated) {
    return { date: currentDate, reconciled: false, reason: "date_not_migration_anchored" };
  }

  const candidates = [];
  const userStartDate = validDate(user?.startDate);
  if (userStartDate && !sameCalendarAnchor(userStartDate, currentDate)) {
    candidates.push({ date: userStartDate, priority: 1, reason: "user_start_date" });
  }

  if (enrollment?.userId && enrollment?.programId) {
    const payment = await Payment.findOne({
      userId: enrollment.userId,
      programId: enrollment.programId,
      status: { $in: ["captured", "approved"] },
    })
      .sort({ paymentDate: 1, createdAt: 1 })
      .select("paymentDate createdAt")
      .lean();
    const paymentDate = validDate(payment?.paymentDate || payment?.createdAt);
    if (paymentDate && !sameCalendarAnchor(paymentDate, currentDate)) {
      candidates.push({ date: paymentDate, priority: 2, reason: "captured_payment_date" });
    }
  }

  const studentCreatedDate = validDate(student?.createdAt);
  if (studentCreatedDate && !sameCalendarAnchor(studentCreatedDate, currentDate)) {
    candidates.push({ date: studentCreatedDate, priority: 3, reason: "student_created_date" });
  }

  candidates.sort((left, right) => left.priority - right.priority || left.date - right.date);
  const selected = candidates[0];
  return selected
    ? { date: selected.date, reconciled: true, reason: selected.reason }
    : { date: currentDate, reconciled: false, reason: "no_authoritative_candidate" };
};
