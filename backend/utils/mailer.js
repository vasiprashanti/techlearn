import nodemailer from "nodemailer";

// Create transporter using actual email credentials from .env
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendMail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: `"TechLearn Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
}
