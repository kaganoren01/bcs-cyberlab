# Cyber Dataset Analytics (CDA)

An interactive cybersecurity training platform built on anonymized operational data from a real Managed Security Service Provider (MSSP). Explore incidents, vulnerabilities, SLA contracts, and analyst workflows — and use AI to understand what it all means.

**Live site:** [your-site.netlify.app](https://your-site.netlify.app) <!-- replace with your actual URL -->

---

## What It Does

CDA gives students and early-career analysts hands-on experience with the kind of data they'll encounter on day one of a SOC job. Instead of textbook examples, everything here is sourced from real security operations work — just fully anonymized.

- **13 relational tables** — incidents, alerts, vulnerabilities, tickets, assets, SLA contracts, analysts, clients, and junction tables
- **100,000+ rows** of anonymized MSSP data
- **AI record explainer** — click any record and get a plain-English breakdown from Claude AI: what it means in a SOC context, what an analyst should act on, and what red flags it raises
- **6-section analytics dashboard** with industry benchmark comparisons
- **Live CVE enrichment** via the NIST National Vulnerability Database API
- **Financial risk estimation** modeled after Splunk SOAR and the FAIR framework
- **Authentication** — email/password accounts restricted to configured domains, with password reset via email

---

## Analytics Sections

Each section includes a reference banner citing the industry source that inspired the methodology.

| Tab | What It Shows | Inspired By |
|---|---|---|
| **Overview** | Security posture snapshot — SLA compliance, alert noise, critical MTTR, unpatched vulns | Synthesis view |
| **Response & SLA** | MTTA/MTTR by severity, SLA compliance rate and breach breakdown | NIST SP 800-61 Rev. 3, SANS IR Lifecycle |
| **Vulnerabilities** | Remediation MTTR by severity, top-10 riskiest assets (CVSS-inspired scoring) | Tenable, NIST NVD, Ponemon Institute |
| **SOC Operations** | Alert fatigue/noise ratio by source, analyst performance, escalation rates | Splunk SOAR Risk-Based Alerting, Gartner SOC Visibility Triad |
| **Client Risk** | Composite risk scores (FAIR model), industry incident breakdown, geographic distribution | FAIR Institute, Verizon DBIR |
| **Financial** | Estimated incident exposure, SLA breach penalties, vulnerability risk exposure — all configurable | IBM Cost of a Data Breach 2024, Splunk SOAR, FAIR model |

> All financial figures are estimates based on industry benchmark rates, not realized dollar amounts. Rates are fully adjustable in-browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 8 (rolldown bundler) |
| Charts | Recharts |
| CSV parsing | PapaParse (client-side, no backend needed for data) |
| Icons | lucide-react |
| AI explanations | Claude Haiku API (`claude-haiku-4-5-20251001`) with SSE streaming |
| CVE enrichment | NIST NVD REST API v2 (live, no auth required) |
| Markdown rendering | react-markdown + remark-gfm |
| Authentication | Netlify Functions + Neon PostgreSQL + bcryptjs + JWT |
| Password reset | Nodemailer + Gmail SMTP |
| Hosting | Netlify (auto-deploy from GitHub) |
| Database | Neon serverless PostgreSQL (auth + settings only; data is static CSVs) |

---

## Project Structure

```
cyber-teach-app/
├── public/
│   └── data/               # 13 CSV files (anonymized MSSP data)
├── netlify/
│   └── functions/          # Serverless backend (auth, settings)
│       ├── auth-login.mjs
│       ├── auth-signup.mjs
│       ├── auth-forgot-password.mjs
│       ├── auth-reset-password.mjs
│       ├── settings-get.mjs
│       └── admin-update-settings.mjs
└── src/
    ├── components/
    │   ├── Analytics.jsx           # Tab shell
    │   ├── AnalyticsOverview.jsx   # Posture snapshot
    │   ├── AnalyticsResponseSLA.jsx
    │   ├── AnalyticsVulns.jsx
    │   ├── AnalyticsSOC.jsx
    │   ├── AnalyticsClientRisk.jsx
    │   ├── AnalyticsShared.jsx     # Shared chart helpers + RefBanner
    │   ├── FinancialImpact.jsx
    │   ├── Dashboard.jsx
    │   ├── DataTable.jsx
    │   ├── TableView.jsx
    │   ├── RecordPanel.jsx         # AI explain + NVD enrichment
    │   ├── LoginPage.jsx
    │   ├── AdminPanel.jsx
    │   ├── AboutPage.jsx
    │   └── TableSkeleton.jsx
    ├── hooks/
    │   ├── useAuth.js
    │   └── useTableData.js         # Module-level CSV cache
    └── utils/
        ├── schema.js               # 13 table definitions
        ├── analytics.js            # All analytics calculation functions
        ├── financialAnalysis.js    # Financial risk engine
        ├── claude.js               # Claude API SSE streaming
        └── columnLabels.js         # Display labels + name merging
```

---

## Key Implementation Details

**Client-side data** — All 13 tables are served as static CSV files parsed in the browser with PapaParse. No database queries for data browsing. A module-level cache in `useTableData` prevents re-fetching when switching views.

**Cross-table joins** — Analytics calculations join tables client-side using `Map` lookups (O(1)). For example, SLA compliance joins incidents to SLA contracts by `ClientID + SeverityLevel` to compute breach overages down to the minute.

**AI streaming** — Claude responses stream in via Server-Sent Events (SSE). The spinner is replaced with live text as the first chunk arrives, giving immediate feedback.

**NVD enrichment** — When viewing any Vulnerability record with a CVE ID, a "Fetch Live CVE Data" button calls the NIST NVD REST API (`nvd.nist.gov`) in real time and displays the CVSS score, vector string, published date, and official description.

**Financial risk engine** — Three independent calculations:
- *Incident exposure*: count by severity × IBM 2024 benchmark cost per severity
- *SLA breach penalty*: actual MTTR minus contracted MTTR (in minutes) × configurable hourly rate
- *Vulnerability risk*: unpatched vulns × days since first detection × FAIR-derived daily rate per severity

All three rates are editable live in-browser with instant recalculation.

**Authentication** — JWT-based (7-day expiry), decoded client-side to check expiry without a round-trip. Admin status (`isAdmin`) is embedded in the JWT and controlled by an `ADMIN_EMAIL` environment variable on Netlify. Admins can update the allowed email domain list from within the app — no redeployment required.

---

## Environment Variables (Netlify)

| Variable | Purpose |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Claude API key for AI explanations |
| `JWT_SECRET` | Secret for signing/verifying auth tokens |
| `ADMIN_EMAIL` | Email address that receives admin privileges on login |
| `GMAIL_USER` | Gmail address for sending password reset emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your account password) |
| `DATABASE_URL` | Neon PostgreSQL connection string (set automatically by Netlify DB) |

---

## Local Development

```bash
npm install
# Create .env.local and add VITE_ANTHROPIC_API_KEY=your_key_here
npm run dev
```

Auth functions require a Netlify dev environment (`netlify dev`) and a connected Neon database to work locally.

---

## About

Built by **Oren Kagan** — cybersecurity student at Belmont University.
Contact: [oren.kagan@bruins.belmont.edu](mailto:oren.kagan@bruins.belmont.edu)

Data sourced from a real MSSP environment and fully anonymized. All client names, analyst names, IP addresses, and hostnames have been replaced or removed.
