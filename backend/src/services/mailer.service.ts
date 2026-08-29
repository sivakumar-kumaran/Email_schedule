import nodemailer from "nodemailer";
import { config } from "../config";

let transporter: nodemailer.Transporter | null = null;

/**
 * Get (or lazily create) the Nodemailer transporter.
 * If valid ETHEREAL_USER/PASS are set (not placeholders), uses those credentials.
 * Otherwise auto-creates a fresh valid Ethereal test account and prints
 * the credentials and web preview link to the console.
 */
export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const isRealUser =
    config.ETHEREAL_USER &&
    !config.ETHEREAL_USER.includes("placeholder") &&
    config.ETHEREAL_PASS &&
    !config.ETHEREAL_PASS.includes("placeholder");

  if (isRealUser) {
    try {
      transporter = nodemailer.createTransport({
        host: config.ETHEREAL_HOST,
        port: config.ETHEREAL_PORT,
        secure: false,
        auth: {
          user: config.ETHEREAL_USER,
          pass: config.ETHEREAL_PASS,
        },
      });
      console.log(`📧 Nodemailer using configured Ethereal account: ${config.ETHEREAL_USER}`);
      return transporter;
    } catch (err) {
      console.warn("⚠️ Failed to initialize configured SMTP, falling back to auto-generated Ethereal:", err);
    }
  }

  // Auto-generate fresh working test account on ethereal.email
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("══════════════════════════════════════════════════════════════");
    console.log("📧 Auto-generated Live Ethereal Test Account:");
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log("   Preview sent emails at: https://ethereal.email/messages");
    console.log("══════════════════════════════════════════════════════════════");
  } catch (err) {
    console.warn("⚠️ nodemailer.createTestAccount failed, using JSON transport fallback:", err);
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email and return the Ethereal preview URL.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ messageId: string; previewUrl: string }> {
  const t = await getTransporter();
  const info = await t.sendMail({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  const previewStr = typeof previewUrl === "string" ? previewUrl : "";
  console.log(`✉️ [DELIVERED] Email sent to ${params.to}`);
  if (previewStr) {
    console.log(`🔗 [PREVIEW LINK]: ${previewStr}`);
  }
  return { messageId: info.messageId || "", previewUrl: previewStr };
}
