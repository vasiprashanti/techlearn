import React from 'react';
import {
  FiFileText,
  FiCheckCircle,
  FiUser,
  FiCreditCard,
  FiXOctagon,
  FiEdit,
  FiAward,
} from 'react-icons/fi';

const TermsAndConditions = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-32 pb-12">
      <div className="terms-wrapper max-w-[1200px] mx-auto p-4 md:p-8 bg-white/5 dark:bg-gray-800/10 shadow-lg rounded-xl">
        <h1
          className="brand-heading-primary hover-gradient-text text-3xl md:text-4xl font-semibold mb-4"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}
        >
          Terms & Conditions
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          Welcome to <strong className="font-semibold text-gray-900 dark:text-white">TechLearn</strong>. By accessing and using our platform, you agree to the following terms and conditions. Please read them carefully.
        </p>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif' "}}
        >
          <FiCheckCircle className="text-blue-500/80" />
          Acceptance of Terms
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          By registering on our platform, you agree to abide by all the terms mentioned herein, as well as any updates that may occur in the future.
        </p>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif' "}}
        >
          <FiUser className="text-blue-500/80" />
          User Responsibilities
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>Maintain the confidentiality of your login credentials.</li>
          <li>Use the platform only for educational and non-commercial purposes unless otherwise agreed.</li>
          <li>Respect intellectual property and not copy, reproduce, or share materials without consent.</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif' "}}
        >
          <FiCreditCard className="text-blue-500/80" />
          Payment & Certification
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>Certificates are issued only upon full completion of the course and successful payment, if applicable.</li>
          <li>Users will receive their certificates via email as a downloadable PDF.</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif' "}}
        >
          <FiXOctagon className="text-blue-500/80" />
          Cancellation & Refund Policy
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>If you paid for a certificate but did not receive it via email, you can request support by contacting <strong className="font-semibold text-gray-900 dark:text-white">9676663136</strong>.</li>
          <li>Upon verification of payment and completion status, we may issue a refund.</li>
          <li>No refunds will be issued for incomplete course progress or incorrect email details entered by the user.</li>
        </ul>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif' "}}
        >
          <FiUser className="text-blue-500/80" />
          Account Termination
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          We reserve the right to suspend or terminate any account found violating our terms or engaging in misuse.
        </p>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif' "}}
        >
          <FiEdit className="text-blue-500/80" />
          Modifications
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          TechLearn reserves the right to update these terms periodically. Users will be notified of significant changes via email or in-app alerts. By continuing to use TechLearn, you acknowledge and accept these terms in full.
        </p>

        <h2
          className="brand-heading-primary hover-gradient-text text-2xl md:text-2xl font-semibold mt-8 mb-4 pl-3 flex items-center gap-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif' "}}
        >
          <FiAward className="text-blue-500/80" />
          User Responsibility & Learning Disclaimer
        </h2>
        <ul className="list-disc pl-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 mb-6">
          <li>It is the sole responsibility of the user to complete all course materials, including quizzes and exercises, sincerely and honestly for optimal learning outcomes.</li>
          <li>TechLearn provides educational content, notes, and assignments for general learning purposes. These resources are not tailored to individual learning levels.</li>
          <li>We are not liable if users are unable to comprehend certain examples, topics, or exercises. Users are encouraged to seek clarification via additional research or by reaching out through available support channels.</li>
        </ul>
      </div>
    </div>
  );
};

export default TermsAndConditions;