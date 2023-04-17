import nodemailer from "nodemailer";

export const sendMail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Brief Me Up" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    html,
  });
};
