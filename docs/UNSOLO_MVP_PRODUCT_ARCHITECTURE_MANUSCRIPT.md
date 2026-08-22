# UNSOLO — MVP PRODUCT & ARCHITECTURE MANUSCRIPT

**Status:** Consolidated product decisions and architecture baseline  
**Purpose:** Source-of-truth planning document for Devin before implementation.

## 1. Product

Unsolo is an international travel platform connecting travellers with other travellers, trip planners, local businesses/service providers, and accommodation hosts.

It supports:

- Planner-led trips
- DIY/community trips
- Service bookings
- Hotels/apartments/accommodation
- Payments and controlled payouts
- Reviews/trust
- Messaging
- DIY shared-expense wallets
- Promotions
- AI travel discovery and planning

## 2. User Types

### Traveller

Can discover trips, join planner trips, create/manage/publish/unpublish DIY trips, define capacity, accept/decline join requests, promote trips, message users, book services/accommodation, participate in trip groups, contribute to DIY wallets, approve/reject DIY withdrawals, and review providers/planners.

### Planner

Can create/manage trips, manage bookings/requests, message travellers, receive payouts, promote trips, and receive reviews. Must be approved before public listing.

### Business / Service Provider

Can create a profile, list services and prices/conditions, upload images, add socials, manage availability, accept/decline reservations, message customers, receive in-app payouts, promote the business, and receive reviews. Must be approved before public listing.

### Host

Can list hotels, apartments, villas and other approved accommodation; set prices/availability, block dates/times, accept reservations, message guests, receive payouts, promote listings, and receive reviews.

### Admin

Dedicated admin dashboard with role-based permissions, custom roles, and maker/checker workflows.

## 3. Fees & Revenue

- DIY trip creation: **$5 Unsolo fee**
- Joining a DIY traveller trip: **$5 Unsolo fee**
- Joining a planner trip: **3% traveller service fee**
- Planner commission: **6% of the total amount the planner receives from the trip**
- Service-provider commission: **5%**
- Accommodation: **host alone pays 10% commission**
- Business listing: **$5/month**
- Promotion: **$1/day**

Promoted content must be clearly labelled.

## 4. Payments

The platform is international.

Use a payment abstraction supporting:

- Stripe for international payments
- A Nigerian/local provider for Nigeria

Do not hardcode providers throughout the application.

### Services

1. Customer requests/books.
2. Provider accepts.
3. Customer pays.
4. Unsolo holds payment.
5. Service is rendered.
6. Customer confirms.
7. Unsolo releases payout and deducts 5%.

**24-hour rule:** If the customer does not confirm within 24 hours, payment is disbursed automatically. This must be server-side and scheduled.

### Accommodation

Guest books and pays through Unsolo. Host receives payout according to the configured payout policy. Host pays the 10% commission.

### Refund protection

Do not design a system where immediate provider payout makes valid refunds impossible. Track gross payment, fees, commissions, payable balance, payout, refund and reserve/negative-balance states separately.

### Financial ledger

All financial activity must be auditable:

- payments
- fees
- commissions
- refunds
- payouts
- wallet transactions
- withdrawals
- adjustments
- reserves/holds

## 5. DIY Trip Wallet

DIY trips have a shared wallet for joint expenses.

Unsolo controls disbursement rules. Exact expense rules can be refined later.

**Every member must approve a DIY wallet withdrawal before it is disbursed.**

Wallet rules:

- server-authoritative balances
- every movement recorded
- every withdrawal auditable
- no client-side financial calculations
- idempotent financial operations

## 6. Cancellation

General rule: users cannot cancel bookings once they are within **5 days of the trip**, unless an explicit exception applies.

Planner cancellation has a **50% cancellation fee**. The exact financial formula must be confirmed before implementation rather than guessed.

Provider/service cancellation rules must be shown before payment.

## 7. Trips

Two main types:

### Planner-led

Planner creates and manages the trip.

### DIY

Traveller creates and manages the trip. Traveller can:

- publish/unpublish
- save drafts
- define capacity
- accept/decline join requests
- message applicants
- manage itinerary/expenses
- manage wallet
- promote the trip

Only trip admins can edit.

### Trip creation

Location hierarchy:
**Country → State/Region → City**

Country comes first. City options depend on country. Location dropdowns are searchable and the country dataset must be complete.

Trip supports:

- title
- description
- type
- country/state/city
- dates
- capacity
- included/excluded interests
- multiple images
- cover image
- trip gallery
- itinerary
- expenses/budget
- pricing where applicable
- conditions
- cancellation policy
- visibility
- promotion

Final creation tab: **Share**.

After successful creation, return to the dashboard Trips page.

### Trip states

- DRAFT
- PUBLISHED
- FULL
- IN_PROGRESS
- COMPLETED
- CANCELLED
- UNPUBLISHED

## 8. Join & Booking

Users must be authenticated to join.

Trip creator must not see a Join button for their own trip.

DIY join flow:
Request → creator views profile → messaging → approve/decline → approved user becomes member.

Capacity must be enforced server-side and transactionally.

Planner must be able to view and message people who book their trips.

## 9. Businesses & Services

Businesses can list multiple services with:

- name
- description
- price
- currency
- duration
- conditions
- images
- availability
- cancellation rules
- location
- category

Businesses can toggle availability globally and block particular dates/times.

Reservation states:
REQUESTED → ACCEPTED → PAYMENT_PENDING → CONFIRMED → IN_PROGRESS → COMPLETED

Alternates:

- DECLINED
- CANCELLED
- REFUND_PENDING
- REFUNDED
- DISPUTED

Prevent double booking transactionally.

## 10. Accommodation

Phase 1 includes hotels/apartments.

Host listings include:

- title
- description
- type
- photos
- amenities
- location
- price/currency
- capacity
- house rules
- cancellation policy
- availability

Hosts can toggle availability and block dates/times.

Guests can search, check availability, reserve, pay, message hosts, receive notifications and review.

Host pays 10% commission.

## 11. KYC & Verification

### Traveller

KYC required. Every traveller must add social profiles.

### Planner

Verification includes:

- NIN/identity
- CAC where applicable
- phone with country-code dropdown
- bank account number
- bank name
- verified account name
- country/state/city/street address

### Business

Verification includes:

- NIN/identity
- CAC where applicable
- phone with country-code dropdown
- bank account number
- bank name
- verified account name
- country/state/city/street address
- Instagram
- X
- business type/category
- business description
- images

Remove registration number and separate “own number” wording. If Other is selected, user types the business type.

Unapproved planners/businesses/hosts are not publicly listed.

After approval, the verification task disappears from the dashboard.

KYC documents must be private, access-controlled, audited and never exposed publicly.

## 12. Trust, Reviews & Safety

Users can review:

- planners
- businesses
- services
- accommodation
- completed trip experiences

Reviews require a legitimate completed experience. One review per eligible booking.

Reviews support:

- overall rating
- written review
- optional photos
- category-specific ratings where useful

Show **Verified Booking** for transaction-backed reviews.

Providers may respond but cannot edit/delete customer reviews.

Users can report reviews and users, and block users.

Admins moderate reports.

Use factual trust indicators instead of a single mysterious trust score:

- identity verified
- business verified
- completed trips/bookings
- rating/reviews
- reliability statistics only after sufficient data

Never expose NIN, bank details, KYC documents or private addresses.

## 13. Messaging

Support:

- traveller ↔ traveller
- traveller ↔ planner
- traveller ↔ business
- traveller ↔ host
- trip group chat
- booking-specific chat
- support/admin conversations

A conversation with no actual message must not appear in history.

Message fields:

- id
- conversation_id
- sender_id
- content
- message_type
- created_at
- delivered_at
- read_at

States:
SENDING → SENT → DELIVERED → READ, with FAILED possible.

Use Supabase Realtime for V1.

Support text, images and basic files. Files go to storage.

Approved trip members enter trip group conversations. Pending/declined users do not.

Users can block/report. Admin access to private conversations is restricted, role-based and audited.

Use rate limits and anti-spam controls.

## 14. Notifications

Channels:

- in-app
- PWA push
- email
- SMS only if later justified

Important notifications:

- verification
- booking
- payment
- refund
- payout
- messages
- join requests
- trip reminders
- reservation updates
- service completion
- wallet events
- security alerts

Trip reminders must always be sent. Exact schedule can be configured.

Use background jobs, not browser timers, for critical scheduled work.

Use **Resend** for transactional email.

## 15. Search & Discovery

Discover:

- trips
- planners
- businesses
- services
- properties

Filters include location, dates, budget, interests, type, rating, verification, availability and relevant category-specific fields.

All large dropdowns must be searchable.

Distinguish:

- **Trending** = popularity/recent activity
- **Recommended** = personalized
- **Promoted** = paid
- **Search result** = matches the query

Promoted results are clearly labelled.

Only approved/active listings appear publicly.

Phase 1 search: PostgreSQL full-text search + indexes. Do not introduce a dedicated search engine prematurely.

## 16. AI & Travel Intelligence

AI helps users discover, plan, compare, estimate and personalize.

### Traveller AI

- destination suggestions
- trip recommendations
- itinerary builder
- travel tips
- budget estimation
- DIY trip planning
- expense estimation
- personalized recommendations

### Planner AI

- descriptions
- itineraries
- activity suggestions
- promotional content

### Business AI

- listing/service descriptions
- promotional content
- FAQ assistance

### AI truth boundary

Unsolo transactional systems are authoritative for:

- listings
- prices
- availability
- bookings
- payments
- wallet balances
- payouts

AI must never invent these.

AI tools should be controlled, such as:

- searchTrips
- getTrip
- searchPlanners
- getPlanner
- searchBusinesses
- getBusiness
- searchProperties
- getProperty
- checkAvailability
- estimateTripCost
- getUserPreferences

AI cannot autonomously:

- pay
- withdraw funds
- approve refunds
- approve disputes
- ban users
- approve KYC
- release disputed funds

Use an AI provider abstraction so the model provider can change.

## 17. Admin

Super Admin has full access.

Create custom roles and assign permissions.

Example permissions:

- payments
- disputes
- planner approval
- business approval
- host approval
- KYC
- reports
- moderation

Sensitive operations can use maker/checker workflows.

Audit logs record:

- actor
- action
- target
- previous state
- new state
- timestamp
- reason where required

Admin must be able to:

- view verification queues
- view uploaded documents
- view user profiles
- approve/reject
- record rejection reasons
- view reports
- update resolution status
- manage disputes
- moderate reviews
- manage roles/permissions

## 18. Authentication

Use **Supabase Auth**.

Support:

- email/password
- OAuth
- forgot password
- password reset
- show/hide password

The same email can support multiple Unsolo profile types without creating duplicate auth identities.

Supported profile types:

- Traveller
- Planner
- Business
- Host

Email verification is required according to account policy.

## 19. Design System

Brand:

- Primary: `#1F2F10`
- Accent: `#6D8D08`
- Neutral: `#E4E9DD`

Direction:

- calm
- modern
- premium
- travel-focused
- restrained

Avoid excessive colour.

Use realistic button styles. No gradients.

Use actual data everywhere. No fake production counters.

PWA is required.

## 20. Architecture

Use a monorepo with frontend and backend together:

```text
unsolo/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── config/
│   └── utils/
├── database/
├── docs/
├── scripts/
└── package.json
```

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:

- Node.js
- modular services/routes

Core backend modules:

- auth
- users
- profiles
- travellers
- planners
- businesses
- hosts
- trips
- bookings
- payments
- wallets
- reviews
- messaging
- notifications
- search
- AI
- KYC
- promotions
- admin

## 21. Database

Use **PostgreSQL via Supabase**.

Use **Drizzle ORM**.

Core entities should include at least:

```text
users
profiles
traveller_profiles
planner_profiles
business_profiles
host_profiles
trips
trip_images
trip_interests
trip_members
trip_join_requests
trip_itineraries
trip_expenses
trip_wallets
trip_wallet_members
trip_wallet_transactions
trip_wallet_withdrawals
trip_wallet_withdrawal_approvals
services
service_images
service_availability
service_reservations
properties
property_images
property_amenities
property_availability
property_reservations
bookings
booking_items
booking_status_history
payments
payment_transactions
refunds
commissions
payouts
ledger_entries
reviews
review_reports
conversations
conversation_members
messages
message_attachments
notifications
notification_deliveries
promotions
kyc_verifications
kyc_documents
admin_roles
permissions
role_permissions
admin_users
audit_logs
reports
disputes
```

Final schema may split/combine entities after architecture review.

## 22. Security

Never rely on frontend checks for security.

Backend enforces permissions.

Use Supabase RLS where appropriate.

Validate API inputs using a shared schema layer such as Zod.

Rate-limit authentication, password reset, messaging, search, AI and financial endpoints.

Payment webhooks must:

- verify signatures
- be idempotent
- record provider event IDs
- never trust client payment state

Never expose secret keys/service-role keys in the browser.

KYC/private attachments use private storage.

## 23. Third-Party Services

### Supabase

Postgres, Auth, Realtime, Storage.

### Stripe

International payments.

### Nigerian/local payment provider

Local payments, behind the payment abstraction.

### Inngest

Scheduled/background workflows:

- trip reminders
- 24-hour service confirmation
- payout release
- promotion expiry
- listing expiry
- other async jobs

### Mapbox

Maps, geocoding, location search and nearby discovery.

### Resend

Transactional email.

### PostHog

Product analytics.

### AI provider

Use an abstraction so provider can be changed.

## 24. Deployment

Separate environments:

- development
- staging
- production

Each environment gets separate credentials/resources where appropriate.

Provide `.env.example`.

Potential environment variables:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_API_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
LOCAL_PAYMENT_SECRET
LOCAL_PAYMENT_WEBHOOK_SECRET
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
MAPBOX_ACCESS_TOKEN
RESEND_API_KEY
POSTHOG_KEY
POSTHOG_HOST
AI_PROVIDER_API_KEY
```

Never commit secrets.

## 25. State Machines

### KYC

PENDING → UNDER_REVIEW → APPROVED  
UNDER_REVIEW → REJECTED  
REJECTED → RESUBMITTED → UNDER_REVIEW

### Trip

DRAFT → PUBLISHED → FULL → IN_PROGRESS → COMPLETED  
PUBLISHED → UNPUBLISHED  
PUBLISHED → CANCELLED

### Join request

PENDING → APPROVED → TRIP_MEMBER  
PENDING → DECLINED

### Booking

REQUESTED → ACCEPTED → PAYMENT_PENDING → CONFIRMED → IN_PROGRESS → COMPLETED

Alternates:

- DECLINED
- CANCELLED
- REFUND_PENDING
- REFUNDED
- DISPUTED

### Service reservation

REQUESTED → ACCEPTED → PAYMENT_PENDING → CONFIRMED → SERVICE_RENDERED → CUSTOMER_CONFIRMED → PAYOUT_RELEASED

No confirmation:
SERVICE_RENDERED → 24 HOURS → PAYOUT_RELEASED

### DIY withdrawal

REQUESTED → AWAITING_MEMBER_APPROVAL → APPROVED → DISBURSED

or:
AWAITING_MEMBER_APPROVAL → REJECTED

## 26. Dashboard

### Traveller

- overview
- trips
- bookings
- reservations
- messages
- wallet
- notifications
- profile
- settings

### Planner

- overview
- trips
- bookings
- earnings
- promotions
- messages
- reviews
- profile
- settings

### Business

- overview
- listings
- services
- reservations
- availability
- earnings
- promotions
- reviews
- messages
- settings

### Host

- properties
- reservations
- availability
- earnings
- promotions
- reviews
- messages
- settings

### Admin

- overview
- verification
- users
- planners
- businesses
- hosts
- trips
- payments
- payouts
- disputes
- reports
- moderation
- roles
- permissions
- audit logs

When a logged-in user navigates from dashboard to public pages, they remain logged in. Do not show anonymous login/signup UI.

## 27. Public Profiles & Landing Page

Profiles support:

- photo
- name
- username
- bio
- interests
- socials
- verification
- reviews
- past trips
- upcoming trips
- relevant listings

Do not truncate names.

Landing page:

- natural hero copy
- business count from real data
- better trending trips
- actual images
- planner/curator details
- participants where appropriate
- social handles where appropriate
- discover planners
- discover businesses
- actual business photos
- reviews
- locations
- messaging

## 28. Product Integrity Rules

1. No fake production data.
2. No frontend-only authorization.
3. No client-controlled financial balances.
4. No client-controlled payment status.
5. No unapproved provider listings.
6. No AI-invented transactional data.
7. No browser-only critical scheduled jobs.
8. No sensitive KYC data in analytics.
9. No unverified webhook state changes.
10. No financial action without an auditable record.
11. No double booking.
12. No DIY wallet withdrawal without required member approvals.
13. No review without an eligible completed experience.
14. No empty conversation in message history.
15. No duplicate authentication identities merely because a user has multiple profile types.

## 29. Implementation Order

### Phase A — Foundation

Monorepo, TypeScript, Next.js, Node API, packages, environments, linting, CI, deployment.

### Phase B — Database & Auth

Supabase, schema, Drizzle, migrations, Auth, profiles, roles, RLS, onboarding.

### Phase C — Profiles & KYC

Traveller, planner, business, host, verification workflows.

### Phase D — Trips

Creation, drafts, publishing, itinerary, expenses, gallery, capacity, join requests, management.

### Phase E — Booking & Payments

Services, reservations, properties, payments, Stripe, local provider, commissions, payouts, refunds.

### Phase F — DIY Wallet

Wallets, contributions, expenses, withdrawals, member approvals, disbursement.

### Phase G — Messaging & Notifications

Realtime chat, notifications, push, Resend, scheduled reminders.

### Phase H — Reviews & Trust

Ratings, reviews, verification badges, reporting, moderation, blocking.

### Phase I — Search & Discovery

Search, filters, locations, ranking, trending, promotion.

### Phase J — AI

AI service, tools/retrieval, travel assistant, itinerary, recommendations and guardrails.

### Phase K — Admin

Roles, permissions, maker/checker, verification, disputes, reports, audit logs.

### Phase L — Hardening

Security, payment, concurrency, authorization, webhooks, PWA, performance, observability and production readiness.

## 30. Decisions Devin Must NOT Guess

Before implementation, explicitly flag:

1. Exact 50% planner cancellation calculation.
2. Exact planner payout timing.
3. Exact accommodation payout timing.
4. Reserve/negative-balance treatment after payout and later refund.
5. Exact refund percentages per booking type.
6. Exact trip reminder schedule.
7. Exact SMS provider if needed.
8. Exact Nigerian payment provider.
9. Exact AI model provider.
10. Exact property cancellation policy.
11. Exact host check-in/check-out rules.
12. Tax/fee treatment in each supported jurisdiction.
13. Legal/compliance requirements for holding/disbursing customer funds internationally.

## 31. Instructions to Devin

Before coding:

1. Read this entire manuscript.
2. Produce a technical implementation plan.
3. Produce a dependency graph.
4. Identify architectural risks.
5. Identify contradictions.
6. Identify decisions requiring confirmation.
7. Propose the database schema.
8. Propose monorepo structure.
9. Propose API modules.
10. Propose frontend boundaries.
11. Propose state machines.
12. Propose integrations.
13. Propose security controls.
14. Propose milestones and complexity.
15. Do not silently change product decisions.
16. Do not replace agreed architecture without explaining why.
17. Do not use fake production data.
18. Use fixtures/seeds only for development/testing and isolate them.
19. Do not begin large-scale implementation until the implementation plan is reviewed.

## 32. Final Principle

Unsolo must be built as a real transactional product, not a collection of screens.

The source of truth is:

```text
Database
+
Domain rules
+
Authorization
+
Payment ledger
+
State machines
+
Auditable workflows
```

The frontend reflects those states.

The backend enforces them.

The payment system records them.

The admin system governs them.

The AI assists users without overriding them.

The goal is an MVP whose foundation can grow into a serious international travel marketplace without requiring a complete rebuild.
