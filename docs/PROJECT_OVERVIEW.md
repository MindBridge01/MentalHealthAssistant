# MindBridge — project overview and audience

Project brief · 3 October 2026 · Draft for project planning and team reference

## 1. The overall idea

**MindBridge is a mental wellbeing support platform that brings self-guided activities, AI-supported conversation, community interaction and access to human professionals into one web and mobile experience.**

The confirmed target audience is the **general public, with a primary focus on people seeking support for mental health concerns such as depression, mental stress and anxiety**. The current prototype accepts adults aged 18+ through its patient registration flow.

A person can create an account, submit registration details, complete onboarding, explore wellbeing activities, record questionnaire responses, talk with the AI assistant, and find a doctor or book an appointment. Professionals manage their profiles and available appointment slots. Administrators review applications and manage platform access.

The current registration flow describes the product as a **university prototype for adults aged 18 and over**, and asks people to use fictional information for demonstrations. That is the most defensible description of its present stage. A live service, established patient population, professional network and clinical effectiveness have not been verified.

This overview is based on the root project source. It separates implemented code, unverified operational facts and proposed planning assumptions.

## 2. Purpose and problem addressed

The product concept addresses a fragmented support journey: people may want an easy starting point for reflection and wellbeing, then a clear route to human support. MindBridge connects those steps within one account rather than requiring a separate application for each activity.

Its intended benefits are:

- A clear entry point for adults looking for wellbeing support.
- Self-guided activities and a conversational interface for reflection.
- A directory and booking workflow connecting users with professionals.
- Community posts and interactions within the platform.
- Administrative review of patient registrations and professional applications.

These are product intentions, not evidence of improved health outcomes. No user research, adoption study or outcome evaluation was supplied with this overview.

## 3. Target audience

| Audience | Likely need | Place in the project | Evidence or assumption |
| --- | --- | --- | --- |
| General public seeking mental health support, currently adults 18+ | Support for concerns such as depression, mental stress and anxiety; reflection, activities and professional access | Confirmed primary audience, represented by patient accounts | Audience confirmed by project owner; adult restriction exists in registration validation |
| University students aged 18+ | A simple support entry point during study or life transitions | One segment within the general public | Included within the audience; no student-only launch restriction |
| Working adults and other adult community members | Convenient access to wellbeing activities and support options | Segments within the confirmed audience | General-public focus confirmed; detailed recruitment plan still open |
| Doctors and relevant mental wellbeing professionals | A profile, visibility, available slots and appointment management | Service providers, represented by doctor accounts | Doctor signup, review, profiles and scheduling exist in code |
| Administrators | Application review, account management and oversight | Platform operators | Admin routes and dashboard exist |
| Trusted contacts or guardians | Receive an SOS notification when configured | Secondary stakeholders | Guardian contact and SOS email flow exist; no separate guardian login role was identified |
| Academic reviewers and project team | Understand and assess the prototype | Project stakeholders | Consistent with the registration flow's university-prototype description |

**Geography:** the project owner confirmed the United States as the primary target market. Initial launch states remain to be selected. Existing Sinhala/Tamil preferences and +94 examples reflect the current prototype and do not establish the intended U.S. experience.

**Language:** the prototype collects English, Sinhala and Tamil preferences. U.S. launch languages, translated consent and clinician language availability must be defined separately; preferences do not establish service coverage.

**Meaning of “patient”:** this is the application's account-role name. Having a patient account does not establish a diagnosis or an existing treatment relationship.

## 4. User roles and responsibilities

The backend recognizes **four authenticated roles**, plus unauthenticated visitors.

| Role | Main responsibilities and experience |
| --- | --- |
| Patient | Register, complete onboarding, use eligible patient features, manage own profile, submit assessments, interact with the community and book appointments |
| Pending doctor | Submit a professional application and wait for administrative approval; some patient-like permissions currently exist |
| Doctor | Maintain professional information, manage available slots and view relevant appointments |
| Administrator | Review professional and patient applications, manage users and roles, and inspect audit records |
| Visitor | Browse public pages and use the public AI chat endpoint where exposed by the client |

Role permissions and registration approval are separate concepts. Creating a patient account does not automatically mean its registration has been approved. A doctor profile row also does not automatically mean the account has the approved doctor role.

Administrative approval in code is not proof that a professional's license has been independently checked. The team must define verification criteria and operating responsibility before describing the network as certified or clinically verified.

## 5. Main features and present status

“Implemented” below means code exists, not that the feature has been validated in a live deployment.

| Area | What the product does | Present status |
| --- | --- | --- |
| Accounts | Password and social login routes; role-based access | Implemented in backend |
| Patient registration | Adult details, consent acknowledgements, submission, review and status history | Implemented |
| Onboarding and profiles | Personal context, guardian information and profile management | Implemented |
| Assessments | Questionnaire submission, score/classification and stored results | Implemented; clinical validation is not established |
| Wellbeing activities | Breathing, grounding and reflective activity content | Implemented catalogue and client experiences |
| AI support | Conversation with input checks, crisis-pattern response, guardrails and response moderation | Implemented pipeline; requires working inference configuration |
| Knowledge retrieval | Embedding-based search used to supply context to AI | Implemented logic; schema/runtime mismatch needs resolution |
| Doctor discovery | Professional profiles and availability | Implemented; directory inclusion and approval policy should be aligned |
| Appointments | Booking and appointment views | Implemented; exclusive slot booking needs strengthening |
| Community | Posts, comments, likes and saves | Implemented; ownership, moderation and legacy route access need review |
| SOS | Email to a configured guardian/trusted contact | Implemented route; actual delivery depends on SMTP setup |
| Administration | User management, doctor review, patient registration review and audit views | Implemented backend workflows with mixed dashboard data quality |
| Payments and advanced reports | Interface entries for future functionality | Placeholder screens; no established complete payment/reporting service |
| Realtime messaging | Socket.IO infrastructure | Empty server connection handler; working realtime workflow not established |

Web uses React; an additional Flutter client exists. Do not promise complete feature parity until both clients are checked against the same workflow list.

## 6. Number of doctors, patients and other users

**Actual counts are currently unverified.** Neither the root nor server database environment file was available during this inspection, and no database connection configuration was present in the command environment. No live database count was performed. Unknown does not mean zero.

| Metric | Actual value | Counting definition |
| --- | --- | --- |
| Total registered accounts | Unverified | All rows in `users` in the chosen environment |
| Patient accounts | Unverified | Users whose current role is `patient` |
| Approved patient registrations | Unverified | Patient users with registration status `approved` |
| Approved doctor accounts | Unverified | Users whose current role is `doctor` |
| Doctor profiles | Unverified | Rows in `doctors`; may include pending applicants |
| Pending doctor accounts | Unverified | Users whose current role is `pending-doctor` |
| Administrator accounts | Unverified | Users whose current role is `admin` |
| Appointment records | Unverified | All rows in `appointments`; this is not necessarily completed consultations |
| Monthly active patients | Not measured here | A defined patient activity during a calendar month; account count is not activity count |

Some UI numbers must **not** be used as evidence:

- `AboutPage.jsx` hardcodes **10k+ active users** and **500+ certified doctors**.
- `AdminDashboard.jsx` substitutes **48 doctors** and **1,245 patients** when calculated counts are zero, and hardcodes **328 bookings**.
- The overview appointment chart uses fixed values.

These are display values or fallbacks, not verified project population statistics. The fallback also makes a genuine zero appear as a positive count. A future dashboard should show zero, loading, unavailable and actual counts distinctly.

Use [project-metrics.sql](project-metrics.sql) to obtain aggregate counts from the intended database. Record the database environment, timestamp and whether test/demo accounts are included. The supplied query includes all existing rows and returns no names, contact details or conversation text. Use a read-only database account where possible.

### Proposed pilot size — illustration only

A manageable planning example is **50 fictional patient accounts, 5 fictional doctor accounts and 2 administrator/test accounts** for a controlled demonstration. These numbers are proposed test-data targets, not actual users, recruitment commitments, infrastructure limits or clinical staffing guidance. They remain unapproved until the project owner chooses a pilot plan.

For a real pilot, choose population size after confirming professional availability, review workload, support responsibilities and the features being evaluated. There is no verified maximum doctor or patient capacity in the current project.

## 7. Typical journeys

**Patient:** discover the platform → create an account → complete registration and consent acknowledgements → receive administrative review → complete onboarding → use available activities, assessments, AI or community → explore professionals and book a suitable slot.

This is the intended overall journey. Current route gates are not completely uniform: AI chat does not currently require patient registration approval, and onboarding can be accessed before approval.

**Doctor:** submit account and professional details → remain pending during review → receive approval → maintain profile → publish available slots → view and manage relevant appointment information.

**Administrator:** inspect pending applications → approve, decline or request more patient information as supported → maintain account access → review audit events and operational issues.

**Trusted contact:** the user configures contact information → the user triggers SOS → the backend attempts an email notification. This is distinct from chat crisis detection, which returns a fixed response rather than automatically emailing the contact.

## 8. Project scope and boundaries

**Confirmed target scope:** professional consultations and treatment for a primarily U.S. audience. See [U.S. clinical registration](US_CLINICAL_REGISTRATION.md) for account, clinical-onboarding and per-visit requirements. These are target requirements, not existing clinical delivery capabilities.

The current scope is a prototype combining wellbeing support and professional appointment access. It does not establish a complete hospital information system, electronic health record service, billing platform, staffed emergency response service or video consultation platform.

Assessments and AI are support features. The repository does not establish diagnostic accuracy, clinical validation or a replacement for professional judgement. Registration review is administrative rather than a diagnosis, as stated in the registration UI.

Security mechanisms include authentication, permissions, selected encrypted fields, input filtering and audit logging. Their existence does not justify claims that all data is encrypted, that operators cannot decrypt records, or that regulatory compliance has been independently established. Some uploaded documents are currently served statically and require an explicit access policy.

## 9. What success should mean

Define success for the prototype through measurable user tasks rather than marketing population figures.

| Goal | Proposed measure |
| --- | --- |
| Easy onboarding | Percentage of test participants completing registration without assistance |
| Understandable approval | Participants can identify their registration status and next step |
| Reliable appointments | Successful booking attempts, conflict handling and absence of duplicate slot bookings |
| Useful discovery | Participants can find a suitable professional and an available slot |
| Clear AI boundaries | Participants understand the assistant's support role; defined safety test cases produce expected responses |
| Effective administration | Review completion rate and turnaround time for test applications |
| Cross-client consistency | Core workflows complete successfully on supported web/mobile configurations |
| Accurate reporting | Aggregate dashboard counts match the chosen database and counting definitions |

Set numerical targets after establishing a baseline. Appointments booked, activities opened or chat sessions created are engagement measures; they do not by themselves demonstrate improved wellbeing.

## 10. Product and operating decisions still needed

| Decision | Current position |
| --- | --- |
| Primary launch audience | General public, especially people seeking support for depression, mental stress and related concerns; current registration accepts adults 18+ |
| Launch region | United States confirmed; initial states pending |
| Actual doctor/patient counts | Database snapshot required |
| Demonstration or live pilot | Real-user professional consultations/treatment is the confirmed goal; current code remains a university prototype |
| Professional verification | Review workflow exists; checking criteria and responsible operator unspecified |
| Launch languages | Preferences collected; translated experience and AI coverage unverified |
| Business model | Not established; do not assume subscriptions, consultation fees or commissions |
| Emergency support ownership | Email/response flows exist; monitoring and response commitments unspecified |
| Data retention and deletion | Policies need definition and alignment with implementation |
| Pilot targets | Illustrative test-data proposal only; owner decision pending |
| Payments, reports and realtime | Future scope to confirm |

## 11. Recommended next steps

1. Turn the confirmed general-public audience into a recruitment plan; confirm region and demonstration/live-pilot status.
2. Capture an aggregate database snapshot with the supplied metrics query.
3. Replace hardcoded and fallback statistics with clearly labelled actual or demo data.
4. Define professional verification, support ownership, privacy/retention and feature scope.
5. Choose a pilot size and evaluation targets, then update this brief with approved decisions.
6. Use the [software architecture](ARCHITECTURE.md) to prioritize implementation gaps before a live release.

## 12. Source map

| Statement | Project evidence |
| --- | --- |
| General-public audience and emphasis on mental health concerns | Project owner confirmation, 3 October 2026 |
| Adult university prototype and language preferences | `server/services/registrationValidation.js`, `client/src/pages/patient/RegistrationPage.jsx` |
| User roles and permissions | `server/config/permissions.js`, `server/middleware/authMiddleware.js` |
| Account and doctor counting distinction | `server/models/userModel.js`, `server/models/doctorModel.js`, `server/routes/authRoutes.js` |
| Patient review | `server/routes/registrationRoutes.js`, `server/models/registrationModel.js` |
| Unsupported displayed statistics | `client/src/pages/AboutPage.jsx`, `client/src/pages/admin/AdminDashboard.jsx`, `client/src/pages/admin/admin-dashboard/Overview.jsx` |
| Feature/data boundaries and technical gaps | `docs/ARCHITECTURE.md`, server routes, services and migrations |
