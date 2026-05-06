export const getWelcomeEmailTemplate = (
  dashboardUrl: string,
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Upside Down</title>
  <style>
    body {
      background-color: #000000;
      color: #f0e6e6;
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      text-align: center;
      background-image: radial-gradient(circle at center, #1a0a0a 0%, #000000 100%);
      border: 1px solid #331111;
    }
    .header {
      margin-bottom: 30px;
    }
    .eyebrow {
      font-family: monospace;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4em;
      color: #aa2222;
      margin-bottom: 10px;
      display: block;
    }
    .title {
      font-size: 28px;
      font-style: italic;
      color: #f0e6e6;
      margin: 0;
      letter-spacing: 0.05em;
    }
    .title-highlight {
      color: #cc2222;
      text-shadow: 0 0 10px rgba(200, 30, 30, 0.6);
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #cccccc;
      margin-bottom: 40px;
      text-align: left;
      padding: 0 20px;
    }
    .cta-container {
      margin: 40px 0;
    }
    .btn {
      display: inline-block;
      background-color: #cc2222;
      color: #ffffff !important;
      font-family: monospace;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      text-decoration: none;
      padding: 14px 30px;
      border: 1px solid #ff4444;
      box-shadow: 0 0 15px rgba(200, 30, 30, 0.4);
    }
    .footer {
      margin-top: 50px;
      border-top: 1px solid #331111;
      padding-top: 20px;
      font-family: monospace;
      font-size: 10px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }
    .flicker {
      color: #cc2222;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="eyebrow">Hawkins National Lab — Protocol 2K26</span>
      <h1 class="title">Welcome to <span class="title-highlight">Catalyst.</span></h1>
    </div>
    
    <div class="content">
      <p>Initiate,</p>
      <p>Your signal has been received. Thanks for completing your application for <strong>Catalyst 2K26</strong>. The gate opens on May 21st at Amity University Kolkata, and we are looking forward to seeing what you build when the lights go out.</p>
      <p>You can now join or create a team via the dashboard.</p>
    </div>

    <div class="cta-container">
      <a href="${dashboardUrl}" class="btn">Enter Dashboard</a>
    </div>

    <div class="content">
      <p style="font-size: 14px; font-style: italic; color: #999999; text-align: center;">
        "Mornings are for coffee and contemplation. Nights are for code."
      </p>
    </div>

    <div class="footer">
      Transmission Terminated.<br>
      <span class="flicker">✦</span> Amity University Kolkata <span class="flicker">✦</span>
    </div>
  </div>
</body>
</html>`;
