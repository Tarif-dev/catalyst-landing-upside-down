/**
 * Wraps custom admin-authored HTML content in the branded Catalyst 2K26
 * "Stranger Things" email shell. This ensures every bulk email sent from
 * the admin panel matches the visual identity of the transactional emails.
 */

const CONTACTS = [
  { name: "Sriparna Das", phone: "+91-8961086320" },
  { name: "Tarif Hussain", phone: "+91-7044989162" },
];

const SOCIAL_URLS = {
  instagram:
    "https://www.instagram.com/hack_catalyst?utm_source=qr&igsh=OXBla2kyeDg5ZzRw",
  discord: "https://discord.gg/SDDT9D5kqs",
  linkedin: "https://www.linkedin.com/in/catalyst-admin-b49136407",
  email: "mailto:catalyst.auk@gmail.com",
};

const contactBlock = () => `
  <div style="height:1px;background:linear-gradient(90deg,transparent,#331111,transparent);margin:30px 20px"></div>
  <div style="font-size:16px;line-height:1.7;color:#ccc;text-align:left;padding:0 20px">
    <p><strong>Contacts</strong></p>
    ${CONTACTS.map(
      (c) =>
        `<p style="margin:6px 0">${c.name}<br><a href="tel:${c.phone.replace(/\D/g, "")}" style="color:#f0e6e6;text-decoration:none">${c.phone}</a></p>`,
    ).join("")}
    <p style="margin-top:18px"><strong>Social Links</strong></p>
    <div style="margin:10px 0 4px">
      ${[
        { label: "Instagram", href: SOCIAL_URLS.instagram },
        { label: "LinkedIn", href: SOCIAL_URLS.linkedin },
        { label: "Discord", href: SOCIAL_URLS.discord },
        { label: "Email", href: SOCIAL_URLS.email },
      ]
        .map(
          (link) =>
            `<a href="${link.href}" style="display:inline-block;margin:0 6px 8px 0;padding:8px 12px;border:1px solid #552020;background:#160808;color:#f0e6e6;text-decoration:none;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.12em">${link.label}</a>`,
        )
        .join("")}
    </div>
  </div>
`;

/**
 * Wrap the admin's custom HTML body inside the Catalyst email shell.
 */
export function getBulkEmailTemplate(bodyHtml: string): string {
  return `<!DOCTYPE html>
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
    .footer{margin-top:50px;border-top:1px solid #331111;padding-top:20px;font-family:monospace;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.2em}
    .flicker{color:#cc2222}
    .divider{height:1px;background:linear-gradient(90deg,transparent,#331111,transparent);margin:30px 20px}
    ul{padding-left:22px;margin:12px 0}
    li{margin:7px 0}
    h1,h2,h3{color:#f0e6e6}
    a{color:#cc2222}
  </style>
</head>
<body>
  <div class="outer">
    <div style="margin-bottom:30px">
      <span class="eyebrow">Catalyst 2K26</span>
    </div>

    <div class="body-text">
      ${bodyHtml}
    </div>

${contactBlock()}
    <div class="footer">
      Transmission Terminated.<br>
      <span class="flicker">*</span> Amity University Kolkata <span class="flicker">*</span>
    </div>
  </div>
</body>
</html>`;
}
