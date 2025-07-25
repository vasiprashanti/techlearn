import React from 'react';
import {
  FiFileText,
  FiDatabase,
  FiLock,
  FiShield,
  FiDisc,
  FiCreditCard,
  FiMail,
  FiUserCheck,
  FiEdit,
} from 'react-icons/fi';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-32 pb-12">
      <div className="terms-wrapper max-w-[1200px] mx-auto p-4 md:p-8 bg-white/5 dark:bg-gray-800/10 shadow-lg rounded-xl">
        <h1
          className="brand-heading-primary hover-gradient-text text-3xl md:text-4xl font-semibold mb-4"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}
        >
          Privacy Policy
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          Your privacy is important to us at <strong className="font-semibold text-gray-900 dark:text-white">TechLearn</strong>. This policy explains what personal information we collect, how we use it, and the choices you have.
        </p>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiDatabase className="text-blue-500/80" />
          Information We Collect
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li><span className="font-semibold">Personal Identification:</span> Name, mobile number, and email address collected at signup or course enrollment.</li>
          <li><span className="font-semibold">Authentication Data:</span> Login details (OAuth or manual login).</li>
          <li><span className="font-semibold">Usage Data:</span> Pages visited, course progress, quizzes attempted, and time spent on our platform.</li>
          <li><span className="font-semibold">Payment Data:</span> UPI ID, Razorpay payment info (via Razorpay’s secure gateway).</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiLock className="text-blue-500/80" />
          How We Use Your Information
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>To deliver personalized course experiences and enable progress tracking across sessions.</li>
          <li>To generate and email certificates upon course completion.</li>
          <li>To notify you about updates, newsletters, and upcoming offerings.</li>
          <li>To maintain platform security and monitor analytics for improving services.</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiShield className="text-blue-500/80" />
          Data Storage & Protection
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>Your data is stored on secure servers and protected by industry-grade encryption and firewall systems.</li>
          <li>We do not sell or rent your personal data to third parties.</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiDisc className="text-blue-500/80" />
          Cookies
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          We use cookies to improve your Browse experience, keep you logged in, and track session performance.
        </p>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiCreditCard className="text-blue-500/80" />
          Payment Information
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          All payment transactions are handled securely via Razorpay. We do not store sensitive payment credentials like your UPI PIN or card number.
        </p>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiMail className="text-blue-500/80" />
          Communication
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>We may send you occasional newsletters, reminders, and updates via email. You can unsubscribe at any time.</li>
          <li>Transactional emails regarding course access, certificates, and payments cannot be opted out of.</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiUserCheck className="text-blue-500/80" />
          User Rights
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>You have the right to access, update, or delete your personal data by emailing us.</li>
          <li>You can request a data export or removal in compliance with applicable data protection laws.</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif'" }}
        >
          <FiEdit className="text-blue-500/80" />
          Policy Updates
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          This Privacy Policy is subject to change. Updates will be posted on this page and, when necessary, communicated via email.
        </p>

        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          If you have questions about our privacy practices, feel free to reach out via our <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact Us</a> page.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;