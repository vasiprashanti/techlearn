import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendCertificate = async ({ name, email, courseName, xp, buffer, certificateId, cloudUrl }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"TechLearn Solutions" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Certificate for ${courseName}`,
    html: `
      <h2>Congratulations, ${name}!</h2>
      <p>You’ve successfully completed the <strong>${courseName}</strong> course with <strong>${xp} XP</strong>.</p>
      <p>Certificate ID: <code>${certificateId}</code></p>
    `,
    attachments: [
      {
        filename: `${courseName}-${name}.pdf`,
        content: buffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

export const sendPaymentStatusEmail = async ({ user, status }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject =
    status === "approved"
      ? "Payment Approved - TechLearn Certificate"
      : "Payment Rejected - TechLearn Certificate";

  const html =
    status === "approved"
      ? `<p>Hi ${user.firstName},</p>
         <p>Your payment has been approved! Your certificate will be sent to you shortly.</p>`
      : `<p>Hi ${user.firstName},</p>
         <p>Unfortunately, your payment has been rejected. Please try again or contact support.</p>`;

  const mailOptions = {
    from: `"TechLearn Solutions" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

