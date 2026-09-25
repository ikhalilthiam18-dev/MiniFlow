from django.http import HttpResponse


def api_home(request):
    html = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Courrier 360 — API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "DM Sans", system-ui, sans-serif;
      min-height: 100vh;
      background: linear-gradient(160deg, #123f31 0%, #0a2920 45%, #17261f 100%);
      color: #e8f0ec;
      padding: 2rem 1.25rem 3rem;
    }
    .wrap { max-width: 720px; margin: 0 auto; }
    .badge {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #123f31;
      background: #d5f65a;
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      margin-bottom: 1rem;
    }
    h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
    .sub { margin-top: 0.75rem; color: rgba(232, 240, 236, 0.72); font-size: 0.95rem; line-height: 1.6; }
    .cards { display: grid; gap: 0.75rem; margin-top: 2rem; }
    a.card {
      display: block;
      text-decoration: none;
      color: inherit;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1rem;
      padding: 1.1rem 1.25rem;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
    }
    a.card:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(213, 246, 90, 0.45);
      transform: translateY(-2px);
    }
    a.card b { display: block; font-size: 1rem; color: #fff; }
    a.card span { display: block; margin-top: 0.35rem; font-size: 0.82rem; color: rgba(232, 240, 236, 0.65); }
    code { font-size: 0.78rem; color: #d5f65a; }
    footer {
      margin-top: 2.5rem;
      font-size: 0.75rem;
      color: rgba(232, 240, 236, 0.45);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <span class="badge">Backend Django</span>
    <h1>Courrier 360</h1>
    <p class="sub">API REST de la Mairie de Ziguinchor — authentification JWT et gestion des courriers administratifs.</p>
    <div class="cards">
      <a class="card" href="/admin/">
        <b>Administration</b>
        <span>Utilisateurs, courriers, contacts et notifications</span>
      </a>
      <a class="card" href="/api/auth/login/">
        <b>Authentification</b>
        <span><code>POST /api/auth/login/</code> — obtenir un jeton JWT</span>
      </a>
      <a class="card" href="/api/courriers/">
        <b>Courriers</b>
        <span><code>GET /api/courriers/</code> — registre arrivée / départ (authentification requise)</span>
      </a>
    </div>
    <footer>Commune de Ziguinchor · Courrier 360 · SQLite (développement)</footer>
  </div>
</body>
</html>"""
    return HttpResponse(html)
