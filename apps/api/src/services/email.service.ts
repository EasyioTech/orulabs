import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "OruLabs <noreply@orulabs.in>";
const RAW_WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const WEB = RAW_WEB_URL.startsWith("http") ? RAW_WEB_URL.replace(/\/$/, "") : `https://${RAW_WEB_URL.replace(/\/$/, "")}`;

// ─── Shared template ────────────────────────────────────────────────

function wrap(title: string, body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';-webkit-font-smoothing:antialiased;">
<div style="max-width:600px;margin:40px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
  <div style="padding:40px 40px 0">
    <div style="margin-bottom:24px">
      <span style="font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Oru</span><span style="font-size:24px;font-weight:800;color:#10b981;letter-spacing:-0.02em;">Labs</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">${title}</h1>
    <div style="width:48px;height:4px;background:#10b981;border-radius:2px;margin:16px 0 32px"></div>
  </div>
  <div style="padding:0 40px 40px;font-size:16px;line-height:1.6;color:#374151;">${body}</div>
  <div style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">You are receiving this email because you signed up for OruLabs, or someone invited you to a session.</p>
    <span style="font-size:12px;color:#9ca3af;font-weight:500;">&copy; ${new Date().getFullYear()} OruLabs &middot; <a href="${WEB}" style="color:#9ca3af;text-decoration:underline;">orulabs.in</a></span>
  </div>
</div>
</body></html>`;
}

function btn(text: string, url: string, color = "#111827") {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0">${text}</a>`;
}

function muted(text: string) {
  return `<p style="margin-top:20px;font-size:13px;color:#9ca3af">${text}</p>`;
}

function stripHtml(html: string) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi, '$3: $2')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&middot;/g, '-')
    .replace(/&copy;/g, '(c)')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

// Pull a bare address out of "Name <addr@x>" for the unsubscribe mailbox / domain hints.
const FROM_ADDR = (FROM.match(/<([^>]+)>/)?.[1] ?? FROM).trim();

async function send(to: string, subject: string, html: string) {
  console.log(`[email] Attempting to send "${subject}" to ${to} from ${FROM}`);
  try {
    const text = stripHtml(html);
    const response = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
      // List-Unsubscribe materially improves inbox placement and is expected by Gmail/Yahoo bulk rules.
      headers: {
        "List-Unsubscribe": `<mailto:${FROM_ADDR}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    console.log(`[email] Resend response:`, JSON.stringify(response));
    if (response.error) {
      console.error("[email] send failed:", response.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send error:", err);
    return false;
  }
}

// ─── Auth emails ────────────────────────────────────────────────────

export async function sendVerificationEmail(opts: { to: string; name: string; url: string; code: string }) {
  return send(
    opts.to,
    "Verify your email address",
    wrap("Verify your email", `
      <p>Hi ${opts.name},</p>
      <p>Please verify your email address to complete your OruLabs account setup.</p>
      ${btn("Verify Email", opts.url, "#10b981")}
      <div style="text-align:center;margin:20px 0">
        <p style="font-size:13px;color:#6b7280;margin-bottom:8px">Or enter this verification code:</p>
        <div style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px 24px;font-size:28px;font-weight:800;letter-spacing:0.15em;color:#111827">${opts.code}</div>
      </div>
      <p style="font-size:13px;color:#6b7280;margin-top:24px;word-break:break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${opts.url}" style="color:#10b981;text-decoration:underline;">${opts.url}</a>
      </p>
      ${muted("This link and code expire in 24 hours. If you didn't create an account, ignore this email.")}
    `),
  );
}

export async function sendResetPasswordEmail(opts: { to: string; name: string; url: string }) {
  return send(
    opts.to,
    "Reset your password",
    wrap("Reset your password", `
      <p>Hi ${opts.name},</p>
      <p>We received a request to reset the password for your OruLabs account. Click the button below to set a new password.</p>
      ${btn("Reset Password", opts.url)}
      <p style="font-size:13px;color:#6b7280;margin-top:24px;word-break:break-all;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${opts.url}" style="color:#111827;text-decoration:underline;">${opts.url}</a>
      </p>
      ${muted("This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.")}
    `),
  );
}

export async function sendPasswordChangedEmail(opts: { to: string; name: string }) {
  return send(
    opts.to,
    "Your password has been changed",
    wrap("Password changed", `
      <p>Hi ${opts.name},</p>
      <p>Your OruLabs account password was successfully changed.</p>
      <p>If you didn't make this change, please reset your password immediately or contact us.</p>
      ${btn("Go to OruLabs", WEB)}
    `),
  );
}

export async function sendWelcomeEmail(opts: { to: string; name: string; loginUrl: string }) {
  return send(
    opts.to,
    "Your OruLabs account is verified",
    wrap("You're all set, " + opts.name, `
      <p>Your email is verified and your OruLabs account is active.</p>
      <p>You can sign in any time to create or join a training session.</p>
      ${btn("Sign in", opts.loginUrl)}
      ${muted("Questions? Just reply to this email.")}
    `),
  );
}

// ─── Workspace & Team emails ────────────────────────────────────────

export async function sendInvitationEmail(opts: {
  to: string;
  inviterName: string;
  workspaceName: string;
  joinUrl: string;
}) {
  return send(
    opts.to,
    `${opts.inviterName} invited you to ${opts.workspaceName}`,
    wrap("You've been invited", `
      <p><strong>${opts.inviterName}</strong> invited you to join <strong>${opts.workspaceName}</strong> on OruLabs.</p>
      ${btn("Accept Invitation", opts.joinUrl, "#10b981")}
      ${muted("This link expires in 7 days.")}
    `),
  );
}

export async function sendFacilitatorInviteEmail(opts: {
  to: string;
  inviterName: string;
  trainingTitle: string;
  role: string;
  joinUrl: string;
}) {
  const roleLabel = opts.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return send(
    opts.to,
    `You're invited to facilitate: ${opts.trainingTitle}`,
    wrap("Facilitator Invitation", `
      <p><strong>${opts.inviterName}</strong> invited you as <strong>${roleLabel}</strong> for the training <strong>${opts.trainingTitle}</strong>.</p>
      ${btn("Accept & Join", opts.joinUrl, "#10b981")}
    `),
  );
}

export async function sendFacilitatorPendingInviteEmail(opts: {
  to: string;
  inviterName: string;
  trainingTitle: string;
  role: string;
  acceptUrl: string;
}) {
  const roleLabel = opts.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return send(
    opts.to,
    `You're invited to facilitate: ${opts.trainingTitle}`,
    wrap("Facilitator Invitation", `
      <p><strong>${opts.inviterName}</strong> has invited you as <strong>${roleLabel}</strong> for the training <strong>${opts.trainingTitle}</strong>.</p>
      <p style="color:#6b7280;font-size:14px">Create an account or sign in with this email to accept.</p>
      ${btn("Accept Invitation", opts.acceptUrl, "#10b981")}
      <p style="color:#9ca3af;font-size:12px;margin-top:16px">This invitation expires in 7 days.</p>
    `),
  );
}

// ─── Training & Session emails ──────────────────────────────────────

export async function sendSessionDigestEmail(opts: {
  to: string;
  trainingTitle: string;
  participantCount: number;
  moduleCount: number;
  completedAt: string;
  analyticsUrl: string;
}) {
  return send(
    opts.to,
    `Session complete: ${opts.trainingTitle}`,
    wrap("Session Complete", `
      <p>Your training session <strong>${opts.trainingTitle}</strong> has ended.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 12px;background:#f3f4f6;border-radius:6px 0 0 0;font-size:13px;color:#6b7280">Participants</td><td style="padding:8px 12px;background:#f3f4f6;border-radius:0 6px 0 0;font-weight:600;color:#111827">${opts.participantCount}</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#6b7280">Modules</td><td style="padding:8px 12px;font-weight:600;color:#111827">${opts.moduleCount}</td></tr>
        <tr><td style="padding:8px 12px;background:#f3f4f6;border-radius:0 0 0 6px;font-size:13px;color:#6b7280">Ended</td><td style="padding:8px 12px;background:#f3f4f6;border-radius:0 0 6px 0;font-weight:600;color:#111827">${opts.completedAt}</td></tr>
      </table>
      ${btn("View Analytics", opts.analyticsUrl)}
    `),
  );
}

export async function sendJoinReminderEmail(opts: {
  to: string;
  trainingTitle: string;
  scheduledAt: string;
  joinUrl: string;
}) {
  return send(
    opts.to,
    `Reminder: ${opts.trainingTitle} starts soon`,
    wrap("Session Reminder", `
      <p><strong>${opts.trainingTitle}</strong> starts at <strong>${opts.scheduledAt}</strong>.</p>
      ${btn("Join Session", opts.joinUrl, "#10b981")}
    `),
  );
}

// ─── Participant emails ─────────────────────────────────────────────

export async function sendParticipantJoinedEmail(opts: {
  to: string;
  participantName: string;
  trainingTitle: string;
  joinCode: string;
  joinUrl: string;
}) {
  return send(
    opts.to,
    `You've joined: ${opts.trainingTitle}`,
    wrap("You're in!", `
      <p>Hi ${opts.participantName},</p>
      <p>You've successfully joined <strong>${opts.trainingTitle}</strong>.</p>
      <div style="text-align:center;margin:20px 0">
        <p style="font-size:13px;color:#6b7280;margin-bottom:8px">Your join code</p>
        <div style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px 24px;font-size:28px;font-weight:800;letter-spacing:0.15em;color:#111827">${opts.joinCode}</div>
      </div>
      ${btn("Open Training", opts.joinUrl, "#10b981")}
      ${muted("Keep this email handy — you may need the join code to re-enter the session.")}
    `),
  );
}

export async function sendParticipantCertificateEmail(opts: {
  to: string;
  participantName: string;
  trainingTitle: string;
  certificateUrl: string;
}) {
  return send(
    opts.to,
    `Your certificate: ${opts.trainingTitle}`,
    wrap("Congratulations!", `
      <p>Hi ${opts.participantName},</p>
      <p>You've completed <strong>${opts.trainingTitle}</strong>. Your certificate of completion is ready.</p>
      ${btn("Download Certificate", opts.certificateUrl, "#10b981")}
    `),
  );
}

export async function sendTrainingInviteEmail(opts: {
  to: string;
  trainerName: string;
  trainingTitle: string;
  joinCode: string;
  joinUrl: string;
  scheduledAt?: string;
}) {
  const scheduleInfo = opts.scheduledAt
    ? `<p>Scheduled for: <strong>${opts.scheduledAt}</strong></p>`
    : "";
  return send(
    opts.to,
    `${opts.trainerName} invited you to a training`,
    wrap("Training Invitation", `
      <p><strong>${opts.trainerName}</strong> has invited you to join <strong>${opts.trainingTitle}</strong>.</p>
      ${scheduleInfo}
      <div style="text-align:center;margin:20px 0">
        <p style="font-size:13px;color:#6b7280;margin-bottom:8px">Join code</p>
        <div style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:12px 24px;font-size:28px;font-weight:800;letter-spacing:0.15em;color:#111827">${opts.joinCode}</div>
      </div>
      ${btn("Join Training", opts.joinUrl, "#10b981")}
    `),
  );
}

// ─── Account emails ─────────────────────────────────────────────────

export async function sendAccountDeletedEmail(opts: { to: string; name: string }) {
  return send(
    opts.to,
    "Your OruLabs account has been deleted",
    wrap("Account deleted", `
      <p>Hi ${opts.name},</p>
      <p>Your OruLabs account and all associated data have been permanently deleted as requested.</p>
      <p>We're sorry to see you go. If this was a mistake or you'd like to come back, you can always create a new account.</p>
      ${muted("If you didn't request this, please contact us immediately.")}
    `),
  );
}
