const nodemailer = require("nodemailer");
const path = require("path");
const {
  OFFICIAL_EMAIL,
  buildReservationGuestEmail,
  buildReservationAdminEmail,
  buildListingGuestEmail,
  buildListingAdminEmail,
} = require("./emailTemplates");

const EMAIL_LOGO_PATH = path.join(__dirname, "..", "assets", "email-logo.png");

let transporter = null;

const mailIsConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );

const getTransporter = () => {
  if (transporter) return transporter;
  if (!mailIsConfigured()) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return transporter;
};

const sendMailSafe = async ({ to, subject, html, text }) => {
  const transport = getTransporter();

  if (!transport) {
    console.warn(
      `[mail] SMTP is not configured; skipped "${subject}" to ${to}`
    );
    return false;
  }

  try {
    const info = await transport.sendMail({
      from:
        process.env.MAIL_FROM ||
        `"Travel Start Hotels" <${OFFICIAL_EMAIL}>`,
      to,
      replyTo: OFFICIAL_EMAIL,
      subject,
      html,
      text,
      attachments: [
        {
          filename: "travel-start-logo.png",
          path: EMAIL_LOGO_PATH,
          cid: "travelstart-logo",
        },
      ],
    });

    console.log(`[mail] Sent "${subject}" to ${to} (${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[mail] Failed to send "${subject}" to ${to}:`, err.message);
    return false;
  }
};

const notifyReservationCreated = async (reservation) => {
  const tasks = [];

  if (reservation.email) {
    tasks.push(
      sendMailSafe({
        to: reservation.email,
        ...buildReservationGuestEmail(reservation),
      })
    );
  }

  tasks.push(
    sendMailSafe({
      to: OFFICIAL_EMAIL,
      ...buildReservationAdminEmail(reservation),
    })
  );

  await Promise.all(tasks);
};

const notifyListingCreated = async (listing) => {
  const tasks = [];

  if (listing.email) {
    tasks.push(
      sendMailSafe({
        to: listing.email,
        ...buildListingGuestEmail(listing),
      })
    );
  }

  tasks.push(
    sendMailSafe({
      to: OFFICIAL_EMAIL,
      ...buildListingAdminEmail(listing),
    })
  );

  await Promise.all(tasks);
};

module.exports = {
  mailIsConfigured,
  sendMailSafe,
  notifyReservationCreated,
  notifyListingCreated,
};
