import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendNewAccessRequestEmail(input: {
  recipients: string[];
  name: string;
  email: string;
  requestUrl: string;
}) {
  const host = process.env.SMTP_HOST;
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || username;
  if (!host || !username || !password || !from || input.recipients.length === 0) {
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: username, pass: password },
  });

  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeUrl = escapeHtml(input.requestUrl);
  await transport.sendMail({
    from,
    to: input.recipients,
    subject: "Permintaan akses aplikasi FHGAS menunggu approval",
    text: `${input.name} (${input.email}) meminta akses ke aplikasi FHGAS. Tinjau permintaan: ${input.requestUrl}`,
    html: `<p><strong>${safeName}</strong> (${safeEmail}) meminta akses ke aplikasi FHGAS.</p><p><a href="${safeUrl}">Tinjau permintaan akses</a></p>`,
  });
  return true;
}
