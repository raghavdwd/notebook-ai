import formData from "form-data";
import Mailgun from "mailgun.js";
import {
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  MAILGUN_FROM,
  CLIENT_APP_URL,
  SERVER_APP_URL,
} from "../../config/contants.js";

let client = null;

const getClient = () => {
  if (!client) {
    const mailgun = new Mailgun(formData);
    client = mailgun.client({
      username: "api",
      key: MAILGUN_API_KEY,
    });
  }
  return client;
};

export const sendVerificationEmail = async (email, token) => {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new Error(
      "Mailgun not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env",
    );
  }

  const verifyLink = `${SERVER_APP_URL}/api/v1/auth/verify-email?token=${token}`;
  console.log(`Verification link for ${email}: ${verifyLink}`); // Log the verification link for debugging
  const message = {
    from: MAILGUN_FROM,
    to: email,
    subject: "Verify your email - Notebook AI",
    html: `
      <h1>Welcome to Notebook AI!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyLink}">${verifyLink}</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
  };

  await getClient().messages.create(MAILGUN_DOMAIN, message);
};
