/**
 * Stranger Things–themed HTML email templates for the Catalyst 2K26
 * registration lifecycle:
 *
 *   1. Welcome / Onboarding
 *   2. Payment Info (with UPI QR placeholder)
 *   3. Payment Confirmed
 *   4. Congratulations – You're In
 */

/* ── shared layout wrapper ─────────────────────────────────── */

const wrap = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Catalyst 2K26</title>
  <style>
    body{background-color:#000;color:#f0e6e6;font-family:'Georgia',serif;margin:0;padding:0;-webkit-font-smoothing:antialiased}
    .outer{max-width:600px;margin:0 auto;padding:40px 20px;text-align:center;background-image:radial-gradient(circle at center,#1a0a0a 0%,#000 100%);border:1px solid #331111}
    .eyebrow{font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.4em;color:#aa2222;margin-bottom:10px;display:block}
    .title{font-size:28px;font-style:italic;color:#f0e6e6;margin:0 0 8px;letter-spacing:0.05em}
    .hl{color:#cc2222;text-shadow:0 0 10px rgba(200,30,30,0.6)}
    .body-text{font-size:16px;line-height:1.7;color:#ccc;margin-bottom:30px;text-align:left;padding:0 20px}
    .body-text p{margin:14px 0}
    .btn{display:inline-block;background-color:#cc2222;color:#fff !important;font-family:monospace;font-size:12px;text-transform:uppercase;letter-spacing:0.3em;text-decoration:none;padding:14px 30px;border:1px solid #ff4444;box-shadow:0 0 15px rgba(200,30,30,0.4)}
    .card{background:#111;border:1px solid #331111;border-radius:8px;padding:24px;margin:24px 20px;text-align:left}
    .card-label{font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#aa2222;margin-bottom:6px}
    .card-value{font-size:18px;color:#f0e6e6;font-weight:bold;letter-spacing:0.02em}
    .card-sub{font-size:13px;color:#888;margin-top:4px}
    .qr-frame{border:2px solid #cc2222;padding:8px;display:inline-block;box-shadow:0 0 20px rgba(200,30,30,0.3);background:#fff;border-radius:4px;margin:16px 0}
    .footer{margin-top:50px;border-top:1px solid #331111;padding-top:20px;font-family:monospace;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.2em}
    .flicker{color:#cc2222}
    .divider{height:1px;background:linear-gradient(90deg,transparent,#331111,transparent);margin:30px 20px}
    .badge{display:inline-block;background:#1a3a1a;color:#4ade80;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;padding:6px 16px;border:1px solid #166534;border-radius:4px}
    .badge-gold{background:#3a2a0a;color:#fbbf24;border-color:#854d0e}
  </style>
</head>
<body>
  <div class="outer">
${body}
    <div class="footer">
      Transmission Terminated.<br>
      <span class="flicker">✦</span> Amity University Kolkata <span class="flicker">✦</span>
    </div>
  </div>
</body>
</html>`;

/* ── 1. Welcome / Onboarding Email ─────────────────────────── */

export function getWelcomeEmailTemplate(dashboardUrl: string) {
  return wrap(`
    <div style="margin-bottom:30px">
      <span class="eyebrow">Hawkins National Lab — Protocol 2K26</span>
      <h1 class="title">Welcome to <span class="hl">Catalyst.</span></h1>
    </div>

    <div class="body-text">
      <p>Initiate,</p>
      <p>Your signal has been received. Thanks for completing your application for <strong>Catalyst 2K26</strong>. The gate opens on <strong>May 21st</strong> at Amity University Kolkata, and we are looking forward to seeing what you build when the lights go out.</p>
      <p>You can now join or create a team via the dashboard.</p>
    </div>

    <div style="margin:40px 0">
      <a href="${dashboardUrl}" class="btn">Enter Dashboard</a>
    </div>

    <div class="body-text">
      <p style="font-size:14px;font-style:italic;color:#999;text-align:center">
        "Mornings are for coffee and contemplation. Nights are for code."
      </p>
    </div>
  `);
}

/* ── 2. Payment Information Email ──────────────────────────── */

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
      <span class="eyebrow">Hawkins National Lab — Clearance Required</span>
      <h1 class="title">Payment <span class="hl">Instructions.</span></h1>
    </div>

    <div class="body-text">
      <p>Hey ${opts.participantName || "Initiate"},</p>
      <p>To complete your entry into <strong>Catalyst 2K26</strong>, every participant pays an individual registration fee of <strong>₹${amount}</strong>.</p>
    </div>

    <div class="card">
      <div class="card-label">Amount</div>
      <div class="card-value" style="color:#cc2222">₹${amount}.00</div>
      <div class="card-sub">Per participant. Pay individually — not as a team.</div>
    </div>

    <div class="card">
      <div class="card-label">Your Personal Pass Code</div>
      <div class="card-value" style="font-family:monospace;letter-spacing:0.2em;color:#cc2222">${opts.passCode}</div>
      <div class="card-sub">Use <strong>CAT-${opts.passCode}</strong> as the payment note / reference.</div>
    </div>

    <div class="card">
      <div class="card-label">UPI ID</div>
      <div class="card-value" style="font-family:monospace;font-size:15px;word-break:break-all">${upiId}</div>
      <div class="card-sub">Pay via GPay, PhonePe, Paytm, BHIM, or any UPI app.</div>
    </div>

    <div style="text-align:center;margin:24px 0">
      <div class="qr-frame">
        <img src="${qrSrc}" alt="UPI QR Code — ₹${amount}" width="260" height="260" style="display:block" />
      </div>
      <div style="font-family:monospace;font-size:10px;color:#666;margin-top:8px;text-transform:uppercase;letter-spacing:0.2em">
        Scan • Pay ₹${amount} • Reply with screenshot
      </div>
    </div>

    <div class="divider"></div>

    <div class="card" style="border-color:#aa2222">
      <div class="card-label" style="color:#cc2222">⚠ Action Required After Payment</div>
      <div class="body-text" style="padding:8px 0 0;margin:0">
        <p style="margin:8px 0"><strong>1.</strong> Pay <strong>₹${amount}</strong> to the UPI ID above (note: <strong>CAT-${opts.passCode}</strong>).</p>
        <p style="margin:8px 0"><strong>2.</strong> <strong>Reply to this email</strong> with a <strong>screenshot</strong> of the successful payment + your UPI transaction reference ID.</p>
        <p style="margin:8px 0"><strong>3.</strong> Our admin team will verify within 24 hours and mark you as paid.</p>
        <p style="margin:8px 0"><strong>4.</strong> You'll get a confirmation email and your Event Pass QR will unlock on the dashboard.</p>
      </div>
    </div>

    <div style="margin:40px 0">
      <a href="${opts.dashboardUrl}" class="btn">Go to Dashboard</a>
    </div>

    <div class="body-text">
      <p style="font-size:14px;font-style:italic;color:#999;text-align:center">
        "The gate demands tribute before granting passage."
      </p>
    </div>
  `);
}

/* ── 3. Payment Confirmed Email ────────────────────────────── */

export function getPaymentConfirmedEmailTemplate(opts: {
  participantName: string;
  passCode: string;
  dashboardUrl: string;
}) {
  return wrap(`
    <div style="margin-bottom:30px">
      <span class="eyebrow">Hawkins National Lab — Clearance Granted</span>
      <h1 class="title">Payment <span class="hl">Confirmed.</span></h1>
    </div>

    <div style="text-align:center;margin:24px 0">
      <span class="badge">✓ Verified & Paid</span>
    </div>

    <div class="body-text">
      <p>Hey ${opts.participantName || "Initiate"},</p>
      <p>Your registration payment for <strong>Catalyst 2K26</strong> has been <strong>verified and confirmed</strong> by our admin team. Your dimensional access is now active.</p>
    </div>

    <div class="card">
      <div class="card-label">Your Pass Code</div>
      <div class="card-value" style="font-family:monospace;letter-spacing:0.2em;color:#4ade80;text-shadow:0 0 10px rgba(74,222,128,0.5)">${opts.passCode}</div>
      <div class="card-sub">Your QR code is now unlocked. Download your pass from the dashboard.</div>
    </div>

    <div class="divider"></div>

    <div class="body-text">
      <p><strong>What's next?</strong></p>
      <p>• Download your <strong>Event Pass</strong> from the dashboard.<br>
         • Share it on LinkedIn, X, or Instagram.<br>
         • Show it at the venue gate on <strong>May 21st</strong>.</p>
    </div>

    <div style="margin:40px 0">
      <a href="${opts.dashboardUrl}" class="btn">View Your Pass</a>
    </div>
  `);
}

/* ── 4. Congratulations Email ──────────────────────────────── */

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
      <span class="eyebrow">Hawkins National Lab — Subject Approved</span>
      <h1 class="title" style="font-size:32px">🎉 You're <span class="hl">In.</span></h1>
    </div>

    <div style="text-align:center;margin:24px 0">
      <span class="badge badge-gold">★ Catalyst 2K26 Participant</span>
    </div>

    <div class="body-text">
      <p>Congratulations, <strong>${opts.participantName || "Initiate"}</strong>!</p>
      <p>You are now an <strong>official participant</strong> of Catalyst 2K26 — Amity University Kolkata's 24-hour AI hackathon. The Upside Down awaits your creation.</p>
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

    <div class="divider"></div>

    <div class="body-text">
      <p><strong>Event Details:</strong></p>
      <p>📅 <strong>May 21–22, 2026</strong><br>
         📍 <strong>Amity University Kolkata</strong><br>
         ⏱ <strong>24 hours</strong> of non-stop building<br>
         🏆 <strong>₹50,000 worth of prize pool</strong></p>
    </div>

    <div class="body-text">
      <p><strong>What to bring:</strong></p>
      <p>💻 Laptop + charger<br>
         🪪 College ID<br>
         🎫 Your Event Pass (download from dashboard)<br>
         ⚡ The will to survive 24 hours in the Upside Down</p>
    </div>

    <div style="margin:40px 0">
      <a href="${opts.dashboardUrl}" class="btn">Open Dashboard</a>
    </div>

    <div class="body-text">
      <p style="font-size:14px;font-style:italic;color:#999;text-align:center">
        "Eleven would be proud. See you at the gate."
      </p>
    </div>
  `);
}
