# HealthCoverSim — Private Health Insurance Quote Simulator

A full-stack web app that simulates a private health insurance quote system. Users can create, view, edit and delete quote records, and each quote produces an estimated monthly and yearly premium built from cover type, hospital and extras cover, applicant ages, Lifetime Health Cover (LHC) loading, the family upgrade fee, and the annual-payment discount.

> **This is a learning simulator only. It is not financial advice and does not reflect any real insurer's pricing.**

**Subject:** CSE3CWA / CSE5006 — Assignment 1, Semester 2 2026

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + React Router 7 (Vite) |
| Backend | Node.js + Express 5 |
| Database | SQLite (`better-sqlite3`) |
| Styling | Plain CSS |

---

## How to Install and Run

**Prerequisites:** Node.js 18 or newer (developed on v26.5.1) and npm.

You need **two terminals** — one for the backend, one for the frontend.

### 1. Backend (terminal 1)

```bash
cd server
npm install
npm start
```

The API runs on **http://localhost:5001**. You should see:

```
Database initialised at: .../server/healthcoversim.db
HealthCoverSim server running on http://localhost:5001
```

Verify it responds: <http://localhost:5001/api/test>

### 2. Frontend (terminal 2)

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## How the Database Is Created

The database requires **no manual setup** — it is created automatically the first time the server starts.

- [`server/init.sql`](server/init.sql) contains the `quotes` table schema, with `CHECK` constraints on every enum column (cover type, cover levels, history values, payment frequency) and a `0–10` bound on the discount.
- [`server/db.js`](server/db.js) opens (or creates) `server/healthcoversim.db`, enables WAL mode, then reads and executes `init.sql`. Because the schema uses `CREATE TABLE IF NOT EXISTS`, restarting the server never destroys existing data.

To create the database without starting the API:

```bash
cd server
npm run init-db
```

The database file is intentionally **not** committed to git — it regenerates on first run.

### Schema

```
id, customer_name, cover_type,
applicant1_age, applicant1_cover_history,
applicant2_age, applicant2_cover_history,
hospital_cover, extras_cover, payment_frequency,
annual_discount, notes, created_at
```

`applicant2_age` and `applicant2_cover_history` are stored as `NULL` for Single cover, and the backend null-checks them before use.

---

## How the Quote Calculation Works

All calculation lives in one place — [`server/utils/calculateQuote.js`](server/utils/calculateQuote.js). Quotes are stored as **raw inputs only**; the premium is recalculated whenever a quote is displayed, so there is a single source of truth and no stale numbers in the database.

### Base prices (per adult, per month)

| Hospital | Price | | Extras | Price |
|----------|-------|---|--------|-------|
| None | $0 | | None | $0 |
| Basic | $90 | | Basic | $25 |
| Bronze | $120 | | Standard | $45 |
| Silver | $160 | | Premium | $70 |
| Gold | $220 | | | |

### The formula

```
hospital (per adult) = tier price × (1 + that adult's LHC loading)
hospital total       = sum over adults (1 for Single, 2 for Couple/Family)
extras total         = extras tier price × adult count
family fee           = $30 if Family, else $0
monthly premium      = hospital total + extras total + family fee
yearly before disc.  = monthly premium × 12
yearly after disc.   = yearly before × (1 − annual discount)   [Yearly only]
```

### LHC loading

Lifetime Health Cover loading applies **only to hospital cover — never to extras.** It is calculated **per applicant**, so in a Couple or Family each adult can carry a different loading.

| Cover history | Loading |
|---------------|---------|
| Yes (had cover before) | 0% |
| No | `(age − 30) × 2%`, only if age > 30 **and** hospital cover is selected |
| Not sure | 0% — not applied, but a per-applicant warning is displayed |

Two guards matter here: if `hospital_cover` is `None` there is nothing to load, so the loading is 0% regardless of age or history; and if age ≤ 30 the loading is 0% because `(age − 30)` would be zero or negative.

### The annual discount

The discount (0–10%) is applied **only when payment frequency is Yearly**. Monthly payers see the monthly premium and the yearly total before discount, and receive no discount even if a percentage is stored on the record.

---

## How Family Cover Is Calculated

Family cover is priced as **two adults plus a flat $30/month upgrade fee**:

1. **Two adults are counted.** Both hospital (each with its own LHC loading) and extras are charged for 2 adults — identical to Couple cover.
2. **Children are not priced individually.** No children's ages are collected. The single $30/month fee covers all dependent children on the policy, which is why Family needs no extra inputs beyond Applicant 2.
3. **The fee is automatic and added once** — not per adult, not per child. The user never enters it.
4. There is **no family discount.** The only discount in the simulator is the annual-payment discount.

So Family = Couple + $30/month. Worked through:

| Step | Result |
|------|--------|
| Applicant 1 — age 40, history No | (40−30)×2% = 20% loading → $160 × 1.20 = **$192** |
| Applicant 2 — age 35, history Yes | 0% loading → **$160** |
| Hospital total | $192 + $160 = **$352** |
| Extras total | $45 × 2 adults = **$90** |
| Family upgrade fee | **$30** |
| **Monthly premium** | $352 + $90 + $30 = **$472** |
| Yearly before discount | $472 × 12 = **$5,664** |
| Yearly after 5% discount | $5,664 × 0.95 = **$5,380.80** |

This matches the worked example in Section 7 of the assignment specification exactly.

---

## Validation

Validation runs on **both** the frontend and the backend, because a user can send data straight to the API and bypass the form entirely.

**Frontend** ([`client/src/components/QuoteForm.jsx`](client/src/components/QuoteForm.jsx)) — required customer name, ages constrained to 18–100 via both `min`/`max` attributes and an explicit check, discount limited to 0–10%, and Applicant 2 age required whenever Couple or Family is selected. Errors are collected and shown in a single summary box above the form; the quote is not submitted.

**Backend** ([`server/routes/quotes.js`](server/routes/quotes.js)) — every field is re-validated on both `POST` and `PUT`. Invalid requests return **HTTP 400** with a JSON array of readable messages, never a 500 crash. Enum values are whitelisted, ages and discounts are range-checked, and Applicant 2 fields are required for Couple/Family and force-nulled for Single. Missing records return **404**.

Verified edge cases include: Applicant 2 missing on Couple/Family; ages of 0, −5, 17, 101 and non-numeric input; discounts of −5% and 15%; `hospital_cover = None` with a loading-eligible age (loading correctly **not** applied); extras-only cover (correctly **not** loaded); "Not sure" history on either or both applicants; Monthly frequency with a discount stored (discount correctly ignored); malformed JSON bodies; and requests for non-existent IDs.

---

## Project Structure

```
CWA_Assessment_1/
├── client/                       # React frontend (Vite)
│   └── src/
│       ├── App.jsx               # Router + nav shell
│       ├── components/
│       │   └── QuoteForm.jsx     # Shared create/edit form + conditional Applicant 2
│       ├── pages/
│       │   ├── QuoteList.jsx     # Home — all quotes, delete
│       │   ├── CreateQuote.jsx   # Create
│       │   ├── QuoteDetail.jsx   # The explanation sheet
│       │   └── EditQuote.jsx     # Pre-filled edit form
│       ├── utils/api.js          # fetch wrappers
│       └── index.css
└── server/                       # Express + SQLite backend
    ├── server.js                 # App entry, CORS, JSON, routes
    ├── db.js                     # DB connection + schema bootstrap
    ├── init.sql                  # quotes table schema
    ├── routes/quotes.js          # CRUD endpoints + validation
    └── utils/calculateQuote.js   # Calculation engine (single source of truth)
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/quotes` | List all quotes (newest first) |
| `GET` | `/api/quotes/:id` | One quote **with its calculated breakdown** |
| `POST` | `/api/quotes` | Create a quote |
| `PUT` | `/api/quotes/:id` | Update a quote |
| `DELETE` | `/api/quotes/:id` | Delete a quote |
| `GET` | `/api/test` | Health check |

---

## Design Decisions

**Raw inputs are stored; the premium is recalculated on read.** The database holds only the input
fields — never the computed premium. Storing the result would be marginally faster to display, but it
creates two sources of truth: if a pricing rule or the LHC formula were ever corrected, every existing
record would still show the old number. Recalculating on read keeps the logic in exactly one file
(`server/utils/calculateQuote.js`) and guarantees every quote reflects the current rules. The trade-off
is slightly more work per request, which is negligible at this scale.

**Validation is duplicated deliberately.** The same rules run on the frontend for immediate feedback
and on the backend because the API can be called directly. The backend is treated as the authority —
the frontend is a convenience, not a guarantee.

**The form uses app-level validation rather than native HTML5 popups.** Native `required` and
`min`/`max` constraints block submission before the app's own checks run, which means only one problem
surfaces at a time in a browser-styled tooltip. Turning them off (`noValidate`) lets the form collect
every problem and present them together in one summary box.

---

## AI Use Declaration

I used AI assistance while building this project. Specifically, it helped me with the visual design
of the website's interface, with debugging — identifying the cause of errors and working out how to
resolve them — and with version control, including committing the project into Git and writing the
commit messages.

---

## Limitation of the Simulator

**The LHC loading is uncapped and permanent, which the real scheme is not.** The simulator applies `(age − 30) × 2%` with no ceiling, so a 100-year-old with no prior cover is charged a 140% loading on hospital cover. The real Australian scheme caps the loading at **70%** and removes it entirely after **10 years of continuous cover** — so a real customer's loading can fall to 0% over time, while in this simulator it depends only on their current age. The app also holds no notion of *when* cover started, only whether it existed, so continuous-cover history cannot be modelled at all.

Other simplifications: prices are fixed constants rather than state-based or insurer-specific; there is no Medicare Levy Surcharge, no Australian Government Rebate on private health insurance, no waiting periods, no excess or co-payment options, and no individual pricing for dependent children.
