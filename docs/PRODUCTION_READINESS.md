# MindBridge production readiness

Assessment date: 3 October 2026

**Current conclusion: a prototype with production-oriented components, not verified production-ready.** Source inspection identifies unresolved release blockers. No deployment audit, load test, accessibility evaluation or complete security verification was performed for this assessment.

This document turns “industry standard” into testable delivery requirements. Professional presentation, framework choice and additional modules do not by themselves establish readiness. An application should meet agreed requirements and demonstrate that through tests and operational evidence.

## Verification references

Use [OWASP ASVS 5.0](https://github.com/OWASP/ASVS/tree/v5.0.0) to select and verify application security requirements. Use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) to define web accessibility requirements. Proposed accessibility target: Level AA for supported web workflows. These are reference frameworks, not certifications already achieved by MindBridge. Select applicable controls and maintain evidence against them; do not claim full conformance from a short checklist.

## Release gates

Priority P0 means address before a public release involving real user data. P1 means establish before operating the service at its agreed scale. Owners and numerical service targets remain to be assigned.

| ID | Priority | Current source evidence or uncertainty | Required outcome | Acceptance evidence |
| --- | --- | --- | --- | --- |
| SEC-01 | P0 | An `admin/admin` login shortcut exists; startup also provisions a fixed-credential administrator and can promote a matching account | Explicit controlled admin provisioning; no default production credentials or implicit account promotion | Production startup cannot create/promote an admin without the provisioning flow; tests verify authorization |
| SEC-02 | P0 | Public `/uploads`, unauthenticated upload and legacy post mutations | Approved public/private media policy, authorized mutations, restricted private-document retrieval | Anonymous and unauthorized requests are denied; allowed public media remains accessible; upload limits and content checks are exercised |
| SEC-03 | P0 | JWT middleware trusts token roles; limiter reads forwarded IP headers directly | Defined session revocation/current privilege checks and trusted-proxy handling; explicit browser CSRF policy | Role removal affects access; spoofed forwarding cannot evade limits; cross-origin state changes follow tested policy |
| DATA-01 | P0 | Knowledge queries use vector operators while schema stores text and disables vector extension | Consistent database extension/schema and embedding dimensions | Fresh-database migration, knowledge load and known-match search pass |
| BOOK-01 | P0 | Appointment insertion precedes slot deletion with no successful-claim check | Atomic exclusive claim, doctor-slot ownership, database invariant and retry behavior | Real database concurrency test produces one booking and a conflict for the competing request |
| DEPLOY-01 | P0 | Nginx serves HTTP and forwards its scheme; production API requires HTTPS | Verified TLS termination, forwarding and private backend/database exposure | End-to-end web/mobile requests through deployment edge pass; direct private services are not publicly reachable |
| AI-01 | P0 | Safety patterns/guardrails exist, but no clinical validation is established; retrieval can fail open to empty context | Defined support boundaries, safety cases, degraded behavior and responsible content review | Agreed crisis, harmful request, history injection and provider-failure cases pass; product wording reflects actual capability |
| PRIV-01 | P0 | Encryption is selective; retention and deletion policies are not established here | Field-level data policy, documented key lifecycle, authorized access and retention/deletion behavior | Tests demonstrate protected record access and recoverable encrypted data; policies match implementation |
| PRODUCT-01 | P0 | Marketing counts and dashboard fallback statistics are unverified | Truthful environment-specific metrics and clear demo/unknown states | Zero remains zero; unavailable data is labelled; aggregates match database snapshot |
| API-01 | P1 | Contracts are spread across routes and two clients | Versioned OpenAPI contract, validation, consistent errors and record-level permissions | Contract tests cover web cookie and mobile bearer flows |
| QA-01 | P1 | Backend tests exist; no root `.github` workflow was found | Automated build/lint/test/dependency checks and reproducible release process | CI runs on the configured repository provider and blocks failed required checks; key workflows pass against a test database |
| OPS-01 | P1 | Static health response; migrations rerun at image startup; no recovery evidence inspected | Controlled migrations, readiness, redacted monitoring, alerts, rollback and restore procedure | Fresh install, dependency failure, rollback and backup restore are demonstrated |
| PERF-01 | P1 | No verified concurrency or latency limits; AI calls lack explicit timeouts | Capacity targets and bounded provider calls based on deployment resources | Repeatable load results meet agreed latency/error targets without duplicate bookings or unbounded work |
| ACCESS-01 | P1 | No accessibility evaluation performed | Accessible registration, login, booking, chat and dashboard workflows | Automated checks plus keyboard/screen-reader evaluation against selected WCAG criteria |
| DOC-01 | P1 | Overview and architecture are present; operating requirements remain open | Traceable product requirements, access matrix, contracts, decisions, test plan and operations guide | Every launch requirement has an owner, implementation reference and verification result |
| US-01 | P0 | U.S. consultations/treatment is now confirmed, but initial states, treating entity and professional disciplines are undecided | Define launch-state/service eligibility and independently verified provider authorization | State/discipline policy approved by qualified review; unsupported combinations cannot proceed to care |
| US-02 | P0 | Account review does not establish clinical enrollment or informed consent | Separate clinical intake, consent evidence, privacy notices and encounter check-in | Clinical/legal owners approve forms and workflow; remote visits validate current location and authorization |
| US-03 | P0 | No complete consultation delivery and clinical-record workflow is established in the inspected source | Select delivery modality, implement encounter/record boundaries and review applicable vendor/privacy arrangements | End-to-end clinical workflow, record-access tests, emergency plan and applicable agreements verified |

CSRF policy, retention and accessibility are pending evaluation requirements; their inclusion does not assert that an exploitable defect or conformance failure has already been demonstrated.

## Delivery order

1. Agree the launch scope: general public seeking mental health support, current adult eligibility, region, professional verification, and demonstration versus real-service operation.
2. Correct security, data and booking blockers without changing unrelated workflows. Preserve existing API paths unless a contract change is intentional.
3. Verify the deployment and core journeys with a real test database and configured inference models.
4. Establish automated release checks and operational recovery evidence.
5. Refactor into the feature boundaries in [ARCHITECTURE.md](ARCHITECTURE.md) as changes warrant; do not postpone correctness for a full folder reorganization.
6. Evaluate applicable external standards and launch requirements, record residual risks and make a release decision based on evidence.

## Documentation set

| Document | Purpose | Status |
| --- | --- | --- |
| [Project overview](PROJECT_OVERVIEW.md) | Audience, product scope, roles, features and count definitions | Draft; actual counts and operating choices pending |
| [Architecture](ARCHITECTURE.md) | Current structure, target boundaries and workflow/data design | Baseline; proposed improvements not implemented |
| This readiness register | Release gates and proof required | Source-based initial assessment |
| Product requirements and access matrix | Numbered requirements, role permissions and acceptance criteria | To develop after implementation/documentation scope is confirmed |
| OpenAPI contract | Requests, responses, authentication and errors | To develop |
| [U.S. clinical registration](US_CLINICAL_REGISTRATION.md) | Account, clinical onboarding, professional verification and per-visit checks | State/legal/clinical review draft |
| Test and evaluation plan | Functional, security, concurrency, AI and accessibility evidence | To develop |
| Deployment/operations runbook | Configuration, release, alerts, recovery and ownership | Existing setup/deployment notes need validation and extension |

## Limits of the conclusion

No actual patient or doctor count is verified. No availability SLA, clinical effectiveness claim, regulatory compliance claim or capacity guarantee is established. Applicable legal and clinical obligations depend on the intended jurisdiction and service model and require separate qualified review. This assessment is a starting point for implementation and verification, not permission to label the product certified or compliant.
