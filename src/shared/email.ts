import nodemailer from "nodemailer";
import { Config } from "../config";

export const sendMail = async (
  config: Config,
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT ?? "587"),
    secure: false,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Brief Me Up" <${config.MAIL_FROM}>`,
    to,
    subject,
    html,
  });
};
