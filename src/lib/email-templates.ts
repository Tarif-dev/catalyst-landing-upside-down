/**
 * HTML email templates for the Catalyst 2K26 registration lifecycle.
 */

const CONTACTS = [
  { name: "Sriparna Das", phone: "+91-8961086320" },
  { name: "Tarif Hussain", phone: "+91-7044989162" },
];

const env = (key: string) =>
  typeof process === "undefined" ? "" : process.env[key] || "";

const socialLinks = () => {
  const siteUrl = env("PUBLIC_SITE_URL");
  return [
    {
      label: "Instagram",
      href:
        env("PUBLIC_INSTAGRAM_URL") || (siteUrl ? `${siteUrl}/#contact` : ""),
    },
    {
      label: "LinkedIn",
      href:
        env("PUBLIC_LINKEDIN_URL") || (siteUrl ? `${siteUrl}/#contact` : ""),
    },
    {
      label: "Discord",
      href: env("PUBLIC_DISCORD_URL") || "https://discord.gg/",
    },
    { label: "Email", href: "mailto:catalyst.auk@gmail.com" },
  ].filter((link) => link.href);
};

const attachmentLinks = () => {
  const baseUrl = env("PUBLIC_SITE_URL");
  if (!baseUrl) return "";

  return `
    <p style="font-size:13px;color:#888">
      Direct links:
      <a href="${baseUrl}/attachments/catalyst-brochure.pdf" style="color:#cc2222;text-decoration:none">Brochure</a>
      &nbsp;|&nbsp;
      <a href="${baseUrl}/attachments/ai-hackathon-rulebook.pdf" style="color:#cc2222;text-decoration:none">Rulebook</a>
    </p>
  `;
};

const contactBlock = () => `
  <div class="divider"></div>
  <div class="body-text">
    <p><strong>Contacts</strong></p>
    ${CONTACTS.map(
      (contact) =>
        `<p style="margin:6px 0">${contact.name}<br><a href="tel:${contact.phone.replace(/\D/g, "")}" style="color:#f0e6e6;text-decoration:none">${contact.phone}</a></p>`,
    ).join("")}
    <p style="margin-top:18px"><strong>Social Links</strong></p>
    <p style="margin:8px 0">
      ${socialLinks()
        .map(
          (link) =>
            `<a href="${link.href}" style="color:#cc2222;text-decoration:none">${link.label}</a>`,
        )
        .join(" &nbsp;|&nbsp; ")}
    </p>
    <p style="font-size:13px;color:#888">The Catalyst brochure and AI hackathon rulebook are attached with this email.</p>
    ${attachmentLinks()}
  </div>
`;

const wrap = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catalyst 2K26</title>
  <style>
    body{background-color:#000;color:#f0e6e6;font-family:Georgia,serif;margin:0;padding:0;-webkit-font-smoothing:antialiased}
    .outer{max-width:600px;margin:0 auto;padding:40px 20px;text-align:center;background-image:radial-gradient(circle at center,#1a0a0a 0%,#000 100%);border:1px solid #331111}
    .eyebrow{font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.35em;color:#aa2222;margin-bottom:10px;display:block}
    .title{font-size:28px;font-style:italic;color:#f0e6e6;margin:0 0 8px;letter-spacing:0.05em}
    .hl{color:#cc2222;text-shadow:0 0 10px rgba(200,30,30,0.6)}
    .body-text{font-size:16px;line-height:1.7;color:#ccc;margin-bottom:30px;text-align:left;padding:0 20px}
    .body-text p{margin:14px 0}
    .btn{display:inline-block;background-color:#cc2222;color:#fff !important;font-family:monospace;font-size:12px;text-transform:uppercase;letter-spacing:0.25em;text-decoration:none;padding:14px 30px;border:1px solid #ff4444;box-shadow:0 0 15px rgba(200,30,30,0.4)}
    .card{background:#111;border:1px solid #331111;border-radius:8px;padding:24px;margin:24px 20px;text-align:left}
    .card-label{font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.25em;color:#aa2222;margin-bottom:6px}
    .card-value{font-size:18px;color:#f0e6e6;font-weight:bold;letter-spacing:0.02em}
    .card-sub{font-size:13px;color:#888;margin-top:4px}
    .qr-frame{border:2px solid #cc2222;padding:8px;display:inline-block;box-shadow:0 0 20px rgba(200,30,30,0.3);background:#fff;border-radius:4px;margin:16px 0}
    .footer{margin-top:50px;border-top:1px solid #331111;padding-top:20px;font-family:monospace;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.2em}
    .flicker{color:#cc2222}
    .divider{height:1px;background:linear-gradient(90deg,transparent,#331111,transparent);margin:30px 20px}
    .badge{display:inline-block;background:#1a3a1a;color:#4ade80;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;padding:6px 16px;border:1px solid #166534;border-radius:4px}
    .badge-gold{background:#3a2a0a;color:#fbbf24;border-color:#854d0e}
    ul{padding-left:22px;margin:12px 0}
    li{margin:7px 0}
  </style>
</head>
<body>
  <div class="outer">
${body}
${contactBlock()}
    <div class="footer">
      Transmission Terminated.<br>
      <span class="flicker">*</span> Amity University Kolkata <span class="flicker">*</span>
    </div>
  </div>
</body>
</html>`;

export function getWelcomeEmailTemplate(dashboardUrl: string) {
  return wrap(`
    <div style="margin-bottom:30px">
      <span class="eyebrow">Catalyst 2K26</span>
      <h1 class="title">Welcome to <span class="hl">Catalyst.</span></h1>
    </div>

    <div class="body-text">
      <p>Hi,</p>
      <p>Your application for <strong>Catalyst 2K26</strong> has been received. The hackathon begins on <strong>May 21, 2026</strong> at <strong>Amity University Kolkata</strong>.</p>
      <p>You can now create or join a team from your dashboard. Your individual event pass code is separate from your team code and will be used for participant verification.</p>
    </div>

    <div style="margin:40px 0">
      <a href="${dashboardUrl}" class="btn">Open Dashboard</a>
    </div>
  `);
}

export function getPaymentInfoEmailTemplate(opts: {
  participantName: string;
  passCode: string;
  dashboardUrl: string;
  upiId: string;
  amount?: number;
}) {
  const upiId = opts.upiId;
  const amount = opts.amount ?? 200;
  const upiUri =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent("Catalyst 2K26")}` +
    `&am=${amount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent("CAT-" + opts.passCode)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}`;

  return wrap(`
    <div style="margin-bottom:30px">
      <span class="eyebrow">Registration Fee</span>
      <h1 class="title">Payment <span class="hl">Instructions.</span></h1>
    </div>

    <div class="body-text">
      <p>Hi ${opts.participantName || "Participant"},</p>
      <p>To complete your entry into <strong>Catalyst 2K26</strong>, every participant pays an individual registration fee of <strong>Rs. ${amount}</strong>. This fee is for your individual event pass and is not part of team identity.</p>
      <p><strong>What you get:</strong></p>
      <ul>
        <li>Free Wi-Fi throughout the event</li>
        <li>Two meals</li>
        <li>Air-conditioned infrastructure</li>
        <li>Participant certificates</li>
        <li>Event ID cards</li>
        <li>Mentorship and training sessions from tech companies</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-label">Amount</div>
      <div class="card-value" style="color:#cc2222">Rs. ${amount}.00</div>
      <div class="card-sub">Per participant. Pay individually, not as a team.</div>
    </div>

    <div class="card">
      <div class="card-label">Your Individual Event Pass Code</div>
      <div class="card-value" style="font-family:monospace;letter-spacing:0.2em;color:#cc2222">${opts.passCode}</div>
      <div class="card-sub">Use <strong>CAT-${opts.passCode}</strong> as the payment note or reference.</div>
    </div>

    <div class="card">
      <div class="card-label">UPI ID</div>
      <div class="card-value" style="font-family:monospace;font-size:15px;word-break:break-all">${upiId}</div>
      <div class="card-sub">Pay via GPay, PhonePe, Paytm, BHIM, or any UPI app.</div>
    </div>

    <div style="text-align:center;margin:24px 0">
      <div class="qr-frame">
        <img src="${qrSrc}" alt="UPI QR Code for Rs. ${amount}" width="260" height="260" style="display:block" />
      </div>
      <div style="font-family:monospace;font-size:10px;color:#666;margin-top:8px;text-transform:uppercase;letter-spacing:0.2em">
        Scan | Pay Rs. ${amount} | Reply with screenshot
      </div>
    </div>

    <div class="divider"></div>

    <div class="card" style="border-color:#aa2222">
      <div class="card-label" style="color:#cc2222">Action Required After Payment</div>
      <div class="body-text" style="padding:8px 0 0;margin:0">
        <p style="margin:8px 0"><strong>1.</strong> Pay <strong>Rs. ${amount}</strong> to the UPI ID above with note <strong>CAT-${opts.passCode}</strong>.</p>
        <p style="margin:8px 0"><strong>2.</strong> Reply to this email with a screenshot of the successful payment and your UPI transaction reference ID.</p>
        <p style="margin:8px 0"><strong>3.</strong> Our admin team will verify your payment within 24 hours and update your status to verified.</p>
        <p style="margin:8px 0"><strong>4.</strong> Your Event Pass QR will unlock on the dashboard after verification.</p>
      </div>
    </div>

    <div style="margin:40px 0">
      <a href="${opts.dashboardUrl}" class="btn">Go to Dashboard</a>
    </div>
  `);
}

export function getPaymentConfirmedEmailTemplate(opts: {
  participantName: string;
  passCode: string;
  dashboardUrl: string;
}) {
  return wrap(`
    <div style="margin-bottom:30px">
      <span class="eyebrow">Status Updated</span>
      <h1 class="title">Payment <span class="hl">Verified.</span></h1>
    </div>

    <div style="text-align:center;margin:24px 0">
      <span class="badge">Verified</span>
    </div>

    <div class="body-text">
      <p>Hi ${opts.participantName || "Participant"},</p>
      <p>Your registration payment for <strong>Catalyst 2K26</strong> has been verified by our admin team. Your individual event pass is now active.</p>
    </div>

    <div class="card">
      <div class="card-label">Your Individual Event Pass Code</div>
      <div class="card-value" style="font-family:monospace;letter-spacing:0.2em;color:#4ade80;text-shadow:0 0 10px rgba(74,222,128,0.5)">${opts.passCode}</div>
      <div class="card-sub">Use this pass for venue verification and meal coupons.</div>
    </div>

    <div class="body-text">
      <p><strong>Next steps:</strong></p>
      <ul>
        <li>Download your Event Pass from the dashboard.</li>
        <li>Bring it to the venue on May 21, 2026.</li>
        <li>Use the same pass for check-in verification and meal coupons.</li>
      </ul>
    </div>

    <div style="margin:40px 0">
      <a href="${opts.dashboardUrl}" class="btn">View Your Pass</a>
    </div>
  `);
}

export function getCongratulationsEmailTemplate(opts: {
  participantName: string;
  teamName?: string;
  track?: string;
  dashboardUrl: string;
}) {
  const trackLabel = opts.track
    ? `AI for ${opts.track.charAt(0).toUpperCase() + opts.track.slice(1)}`
    : "";

  return wrap(`
    <div style="margin-bottom:30px">
      <span class="eyebrow">Catalyst 2K26</span>
      <h1 class="title" style="font-size:32px">You're <span class="hl">In.</span></h1>
    </div>

    <div style="text-align:center;margin:24px 0">
      <span class="badge badge-gold">Catalyst 2K26 Participant</span>
    </div>

    <div class="body-text">
      <p>Congratulations, <strong>${opts.participantName || "Participant"}</strong>!</p>
      <p>You are now an official participant of <strong>Catalyst 2K26</strong>, Amity University Kolkata's 24-hour AI hackathon.</p>
    </div>

    ${
      opts.teamName
        ? `
    <div class="card">
      <div class="card-label">Your Team</div>
      <div class="card-value">${opts.teamName}</div>
      ${trackLabel ? `<div class="card-sub">Track: ${trackLabel}</div>` : ""}
    </div>`
        : ""
    }

    <div class="body-text">
      <p><strong>Event Details:</strong></p>
      <ul>
        <li><strong>May 21-22, 2026</strong></li>
        <li><strong>Amity University Kolkata</strong></li>
        <li><strong>24 hours</strong> of non-stop building</li>
        <li><strong>Rs. 50,000 worth of prize pool</strong></li>
      </ul>
    </div>

    <div class="body-text">
      <p><strong>What to bring:</strong></p>
      <ul>
        <li>Laptop and charger</li>
        <li>College ID</li>
        <li>Your Event Pass from the dashboard</li>
      </ul>
    </div>

    <div style="margin:40px 0">
      <a href="${opts.dashboardUrl}" class="btn">Open Dashboard</a>
    </div>
  `);
}
