# MindBridge Patient Questionnaire System

## Document purpose

This document explains how the **Patient Questionnaire System** works in the current **MindBridge** project.

It is written for a complete beginner, so it explains:

- what the questionnaire is
- why the project needs it
- how the user moves through it
- how answers are stored and used
- what is already implemented
- what can still be improved

## Scope note

In the current codebase, MindBridge does **not** use one single giant questionnaire.

Instead, it uses **two connected patient-input flows**:

1. **Patient onboarding**
   This is the first-time setup flow. It collects basic personal and safety-related information before the patient can use the full dashboard.

2. **Short emotional assessment**
   This is a repeatable mental wellness check-in. It asks a small set of emotional-state questions, calculates a score, and recommends the next best support option.

There is also a broader **profile settings** area in the project where more medical and contact information can be stored later. That is related to the questionnaire system, but it is not the same as the main onboarding or assessment flow.

There is also an older questionnaire screen in the repository, but the active patient route now points to the newer assessment experience. This document focuses on the **currently active system**.

---

## 1. Overview

### What is a patient questionnaire?

A patient questionnaire is a structured set of questions that a patient answers so the system can understand:

- who the patient is
- what they are currently experiencing
- what kind of support they may need
- what important safety details should be known

In simple terms, it is the system's way of saying:

> "Before we try to help you, tell us a little about yourself and how you are doing."

### Why it is important in this project

MindBridge is a mental wellness support platform. It includes:

- AI chat
- calming activities
- doctor discovery and booking
- emergency/SOS support
- a patient dashboard

Because of that, the system cannot treat every patient exactly the same way.

The questionnaire helps MindBridge:

- personalize the experience
- understand current emotional distress
- decide what support path to suggest next
- collect emergency contact details for safety
- prevent the platform from feeling random or generic

Without a questionnaire, the platform would have much less context and would be less safe, less personal, and less useful.

### How it fits into the overall MindBridge system

The questionnaire sits near the beginning of the patient journey:

1. The patient signs up or logs in.
2. If onboarding is not complete, the patient is sent to the onboarding flow first.
3. After onboarding, the patient enters the main dashboard.
4. From the dashboard, the patient can take a short assessment.
5. The assessment result suggests the next support path:
   - calming activities
   - AI chat
   - doctor support

So the questionnaire system works as a **decision-support layer** inside MindBridge.

It is not just a form. It is a **routing mechanism** that helps the platform choose the most appropriate next step.

---

## 2. Purpose of the Questionnaire

### What problems it solves

The questionnaire solves several product and care problems at the same time.

#### Problem 1: The system does not know the patient yet

When a new patient enters the platform, MindBridge needs at least a small amount of context:

- name
- age
- gender
- emergency contact
- a little emotional background

Without that information, personalization is weak and some safety features cannot work well.

#### Problem 2: The system needs a simple way to understand current distress

A patient may be:

- mildly stressed
- emotionally overwhelmed
- isolated
- struggling with sleep
- having trouble focusing

The short assessment gives the system a quick way to estimate the **current support level** without claiming to make a medical diagnosis.

#### Problem 3: Patients need clear next steps

A patient who feels unwell usually does not want to guess what to do next.

The questionnaire helps answer practical questions like:

- "Should I try a calming activity first?"
- "Would AI chat be a good next step?"
- "Should I consider booking a doctor?"

#### Problem 4: Safety features need trusted contact details

MindBridge includes an SOS feature. That means the system needs a guardian or trusted person contact. The onboarding flow collects that information early so the patient does not have to enter it during a stressful moment.

### Why we collect this data from patients

MindBridge collects this data to:

- personalize communication
- understand the patient's emotional context
- support safer recommendations
- enable doctor booking and care coordination
- support emergency contact workflows
- show useful information on the dashboard later

The key idea is that the platform is trying to be **supportive and context-aware**, not just interactive.

### How it helps doctors, AI, and system decisions

#### How it helps the system

The system uses questionnaire data to:

- mark onboarding as complete
- show the right pages after login
- store a latest assessment result on the dashboard
- calculate a support classification such as low, medium, or high
- choose a recommended next step

#### How it helps AI

In the current implementation, the assessment does **not appear to directly feed its answers into the AI model prompt**.

Instead, the questionnaire helps AI **indirectly** by:

- guiding patients toward AI chat when that seems useful
- collecting general mental health context during onboarding
- shaping the overall patient experience before chat begins

This is an important design detail:

- the questionnaire is currently more of a **support-routing system**
- it is not yet a full **AI intake memory system**

#### How it helps doctors

In the current project, doctor-facing questionnaire integration appears limited.

Doctors clearly use related patient information through:

- appointments
- patient profile details
- booking context

But the current doctor dashboard does **not strongly expose questionnaire results yet**.

That means the questionnaire today is used more strongly for:

- patient guidance
- patient safety
- platform navigation

than for deep clinical review inside the doctor interface.

---

## 3. Types of Questions Included

This section explains both:

- what the current project already asks
- what category each question belongs to

Some categories are fully implemented, some are partially implemented, and some are only lightly covered today.

### A. Personal information

This category is clearly implemented.

Purpose:

- identify the patient
- personalize the experience
- support booking and communication

Examples used in MindBridge:

- Name
- Age
- Gender

Real project examples:

- "What should we call you?"
- "Your age"
- gender selection such as:
  - Woman
  - Man
  - Non-binary
  - Prefer not to say

Why this matters:

- the system can address the patient more naturally
- age and gender may matter for care context
- profile completeness is needed before some features can be used

### B. Medical history

This category is **partially implemented**.

In the active onboarding flow, medical history is not deeply collected.

However, the wider profile system supports medical context through fields like:

- illnesses
- medical history notes
- broader care profile information

Example:

- "Current illnesses, history, or notes"

Why this matters:

- helps future doctor interactions
- provides relevant care context
- supports more complete patient records

Current limitation:

- medical history is not yet a major part of the active onboarding questionnaire
- it exists more as profile data than as a guided questionnaire experience

### C. Lifestyle (sleep, diet, exercise)

This category is **lightly covered** in the current system.

MindBridge currently includes some indirect lifestyle-related questions, especially around sleep and daily functioning.

Examples already present:

- sleep difficulty
- trouble focusing on study, work, or regular tasks
- difficulty returning to calm after stress

Example question:

- "How often has sleep felt difficult or less restorative than usual?"

What is missing today:

- diet questions
- exercise questions
- routine questions
- screen-time or substance-use questions

So lifestyle is present in a limited way, but not yet as a full lifestyle questionnaire.

### D. Mental health or emotional state

This is the strongest and most central category in the current project.

The short assessment focuses mainly on emotional wellbeing.

Examples include:

- feeling emotionally stretched
- feeling overwhelmed
- sleep problems connected to emotional distress
- reduced enjoyment in daily life
- loneliness
- poor focus
- difficulty calming down

Real examples from the project:

- "Over the last two weeks, how often have you felt emotionally stretched or overwhelmed?"
- "How often have everyday activities felt harder to start or enjoy?"
- "How often have you felt alone with what you're carrying?"

Why this matters:

- it gives MindBridge a quick picture of present emotional load
- it is short enough to complete without exhausting the patient
- it supports a non-diagnostic but useful next-step recommendation

### E. Symptoms and current issues

This category is also actively implemented.

Symptoms in MindBridge are currently collected in a gentle, non-medical style. That is a good UX choice for a mental wellness product.

Instead of asking highly clinical questions, the system asks about experiences such as:

- overwhelm
- poor sleep
- trouble focusing
- reduced enjoyment
- isolation
- inability to regain calm

There is also an onboarding free-text field for personal context.

Example:

- "What would you like us to know?"

A patient might answer:

- "I have been feeling stressed for a few weeks and I cannot settle down at night."

That gives the system richer context than a checkbox alone.

### F. Goals (what the patient wants to achieve)

This category is **not strongly implemented as a separate structured section yet**.

Right now, goals are only implied through:

- the open text context field
- the patient's later actions
- which support path they choose next

For example, a patient might type:

- "I want better sleep"
- "I want to feel less overwhelmed"
- "I want someone to talk to"

But there is no dedicated "Goals" step yet such as:

- "What would you like to improve first?"
- "What does better look like for you?"

This is a major opportunity for improvement because goals help the system become more human-centered and action-oriented.

### Summary of category coverage

| Category | Current status in MindBridge | Notes |
| --- | --- | --- |
| Personal information | Strongly implemented | Core onboarding fields exist |
| Medical history | Partially implemented | Mainly supported in profile settings |
| Lifestyle | Lightly implemented | Sleep and functioning are present, diet and exercise are not |
| Mental health / emotional state | Strongly implemented | Main purpose of short assessment |
| Symptoms / current issues | Strongly implemented | Asked in supportive language |
| Goals | Weakly implemented | Mostly implied, not structured yet |

---

## 4. Question Formats

Different question types serve different purposes. MindBridge already uses several useful formats.

### A. Multiple choice

This format gives the patient a fixed list of options.

Why it is useful:

- easy to answer
- easy to score
- easy to compare across patients
- reduces typing effort

Examples in MindBridge:

- gender selection
- emotional check-in response options

Assessment example:

- Not at all
- A few days
- More than half the days
- Nearly every day

When to use:

- when the system needs consistent data
- when the patient should not have to think too hard about wording

### B. Yes/No

This format is useful for simple confirmations and binary decisions.

In MindBridge, the clearest example is the consent checkbox, which acts like a Yes/No input:

- Yes, I understand
- No, I do not consent

Example concept:

- "Do you agree that MindBridge is a support platform and not emergency care?"

Why it is useful:

- simple
- legally and ethically important
- good for consent and safety statements

### C. Scale-based questions

This format measures intensity, frequency, or agreement.

Many beginners think scale-based questions must always be from 1 to 10, but that is not required.

MindBridge currently uses a **4-point frequency scale**, not a 1 to 10 scale.

Current example:

- 0 = Not at all
- 1 = A few days
- 2 = More than half the days
- 3 = Nearly every day

This works well because it is:

- short
- easy to score
- emotionally easier than a large numeric scale

If the product later wanted a 1 to 10 version, an example could be:

- "On a scale from 1 to 10, how overwhelmed do you feel today?"

But that is **not** the current active implementation.

### D. Open-ended questions

This format lets the patient answer in their own words.

MindBridge uses this for emotional context.

Example:

- "What would you like us to know?"

Possible patient response:

- "I feel more stressed at night and I have trouble switching my mind off."

Why it is useful:

- captures nuance
- helps the patient feel heard
- allows issues not covered by fixed options

Risk:

- harder to analyze automatically
- can feel heavy if overused

Best use:

- one or two carefully placed questions, not a long essay section

### E. Conditional questions

Conditional questions appear only when needed, based on earlier answers.

Example concept:

- If a patient says sleep is a major issue, show a follow-up sleep question.
- If a patient reports feeling unsafe, show emergency guidance immediately.

#### Current status in MindBridge

The active questionnaire system has **very limited true conditional branching**.

What it currently does:

- prevents moving forward if required fields are missing
- allows the emotional context text box to stay empty because it is optional
- requires at least one emergency contact method
- requires an answer for each assessment question before continuing

What it does **not** strongly do yet:

- show new question sets based on previous answers
- branch into deeper symptom-specific pathways
- personalize follow-up questions in real time

So conditional logic is more of a **future opportunity** than a current system strength.

---

## 5. Questionnaire Flow (Step-by-Step)

This section explains the actual patient journey through the active system.

### 5.1 Entry point

When a patient signs in, MindBridge checks whether onboarding is complete.

If onboarding is not complete:

- the patient is redirected to the onboarding flow

If onboarding is complete:

- the patient can go to the dashboard

This is important because the project treats onboarding as a required setup step, not an optional form.

### 5.2 Onboarding flow

The onboarding flow has **four steps**:

1. Basic info
2. How you've been feeling
3. Emergency contact
4. Consent

### Step 1: Basic info

The patient enters:

- name
- age
- gender

These fields are required before moving forward.

### Step 2: How you've been feeling

The patient sees an open text area and can describe what has been going on emotionally.

This step is softer and more human. It lets the patient share context in plain language.

Example:

- "I feel more anxious lately and I want help getting back to a calmer routine."

This field is optional, which is a good design choice because not every patient is ready to write something personal immediately.

### Step 3: Emergency contact

The patient adds a trusted person:

- guardian or trusted person name
- email
- phone

The current validation rule requires at least one contact method:

- email or phone

This is useful because SOS support depends on having someone reachable.

### Step 4: Consent

The patient reviews an important care note and confirms consent.

This includes the message that:

- MindBridge is a support platform
- it is not a substitute for emergency care
- it is not a clinical diagnosis tool
- onboarding details will be stored to personalize the experience

The patient must accept consent to finish onboarding.

### 5.3 Navigation in onboarding

The onboarding flow supports:

- Continue
- Back

It does **not** include a dedicated Skip button.

Practical meaning:

- required fields cannot be skipped
- optional text can effectively be skipped by leaving it empty

### 5.4 Progress tracking in onboarding

MindBridge shows:

- current step number
- total number of steps
- step labels
- a progress indicator bar

This is good UX because patients can see:

- where they are
- how much is left
- that the process is short

### 5.5 Onboarding completion state

When the patient finishes:

- the data is saved
- onboarding is marked complete
- the patient is taken to the dashboard

This completion state matters because the app uses it later to decide whether the patient may enter the full patient area.

### 5.6 Assessment flow

After onboarding, the patient can start the short emotional check-in assessment from the dashboard.

### Assessment structure

The active assessment contains **six questions**:

1. emotional overwhelm
2. sleep difficulty
3. reduced interest or enjoyment
4. feeling alone
5. trouble focusing
6. trouble returning to calm

Each question uses the same response scale:

- Not at all
- A few days
- More than half the days
- Nearly every day

### How questions are presented

The patient sees:

- one main question at a time
- large answer buttons
- a clear label such as "Question 2 of 6"
- a side progress panel showing all question positions

This keeps the experience focused and prevents cognitive overload.

### Navigation in assessment

The assessment supports:

- Continue
- Previous

Important detail:

- the patient cannot move forward without choosing an answer for the current question
- there is no true Skip button for assessment questions

This makes sense because the assessment score depends on having a complete answer set.

### Error handling

If the patient tries to continue without choosing an answer, the system shows a friendly message:

- "Choose the option that feels closest right now."

This is a good UX pattern because it is:

- clear
- not blaming
- emotionally gentle

### 5.7 Assessment scoring

After the final answer:

- the system adds the numeric values of all responses
- it calculates a total score
- it maps the score into a support classification

Current rule:

- **0 to 4** = low support recommendation
- **5 to 8** = medium support recommendation
- **9 or more** = high support recommendation

### 5.8 Assessment result

The result page shows:

- support level
- score
- explanation text
- next recommended action

Current next-step mapping:

- **Low** -> try calming activities
- **Medium** -> open AI chat
- **High** -> find a doctor

This is one of the most important parts of the questionnaire system, because it transforms raw answers into an understandable next step.

### 5.9 Completion state after assessment

After submission:

- the assessment is stored
- the patient can review the result
- the latest result appears later on the dashboard

That means the questionnaire does not disappear after completion. It becomes part of the patient's ongoing support journey.

---

## 6. UX Considerations

Designing health-related questionnaires is not just about collecting data. It is about making people feel safe enough to answer honestly.

### A. How to make it easy and not overwhelming

MindBridge already uses several strong UX choices:

- short onboarding steps instead of one long page
- one assessment question at a time
- plain language instead of heavy medical language
- visible progress indicators
- friendly explanatory text

Why this matters:

- patients may already feel stressed, tired, or emotionally overloaded
- a large or clinical-looking form can increase drop-off
- smaller steps feel more achievable

### B. Reducing user friction

Good friction reduction patterns in this project include:

- preloading existing onboarding data when available
- reusing simple answer formats
- using buttons instead of requiring text for every assessment answer
- allowing optional context text instead of forcing it
- giving a clear path after the result

Still, some friction remains:

- there is no save-and-resume draft system
- there is no explicit optional/required indicator on every field
- emergency contact collection may feel heavy to some users early in the flow

### C. Keeping users engaged

MindBridge tries to keep the experience emotionally supportive by:

- using warm, non-judgmental language
- explaining that the assessment is not a diagnosis
- showing what comes next
- connecting the questionnaire to meaningful actions like chat, activities, or doctor booking

This is important because patients are more likely to complete a form when they understand:

- why they are answering it
- what benefit they will get from it

### D. Accessibility considerations

Accessibility means making the questionnaire usable for people with different abilities, devices, and stress levels.

Important accessibility goals for this kind of system:

- keyboard-friendly navigation
- clear field labels
- readable contrast
- large tap targets on mobile
- understandable error messages
- progress information that does not rely on color alone
- support for screen readers
- plain language wording

MindBridge already helps with some of this through:

- large clickable response cards
- clear step labels
- simple text

Recommended accessibility improvements:

- announce validation errors more clearly for screen readers
- add stronger text explanations for required vs optional fields
- make progress understandable without color only
- ensure focus states are visually obvious
- support reduced-motion preferences if animated transitions are added later

### E. Emotional UX for healthcare

This type of product needs emotional sensitivity.

Good emotional UX means:

- never sounding cold
- never sounding alarming unless risk is real
- never making the patient feel tested or judged

MindBridge does this reasonably well by using supportive wording such as:

- "A short emotional check-in"
- "This is not a diagnosis"
- "Choose the option that feels closest right now"

That tone matters a lot in mental wellness products.

---

## 7. Data Handling

### What happens to the answers after submission

After the patient submits information:

- onboarding answers are saved as part of the patient's profile
- assessment answers are saved as an assessment session
- the system also stores result information such as score and recommendation

So the platform keeps both:

- the **raw answers**
- the **interpreted outcome**

### How the data is stored conceptually

You do not need to understand code to understand the storage model.

Think of it like this:

#### Profile storage

The onboarding flow writes data into a patient profile record.

That record can contain:

- age
- gender
- mental health context
- guardian name
- guardian phone
- guardian email
- consent accepted
- onboarding completed

This profile acts like the patient's long-term setup information.

#### Assessment storage

Each completed assessment is stored as a separate record containing:

- patient ID
- question responses
- total score
- support classification
- recommendation text
- created date

This makes assessments behave like historical check-ins instead of one permanent profile value.

That is a good design choice because emotional states change over time.

### Privacy and sensitivity considerations

This data is highly sensitive.

It includes:

- mental health context
- personal identity information
- guardian contact information
- symptom-like emotional responses

MindBridge already shows several privacy-aware design patterns:

- role-based permissions exist
- patients can view their own data
- doctors have separate permissions
- audit logging exists for important record access
- the codebase includes data-classification and encryption utilities for sensitive fields

### Important implementation nuance

The project clearly intends to treat profile and health-related fields as protected data.

However, in the current codebase:

- the general profile route explicitly uses the encryption helper for sensitive profile fields
- the onboarding route appears to save profile-related onboarding fields more directly

For a beginner, the important takeaway is:

- the product is designed with privacy in mind
- but the onboarding path should be reviewed carefully to make sure it uses the same protection standard as the broader profile path

### Should assessment answers also be treated as sensitive?

Yes.

Even though they are not a medical diagnosis, they still reveal:

- emotional distress level
- sleep difficulty
- loneliness
- trouble functioning

That means assessment answers should be treated as sensitive wellness data.

Best practice would be:

- protect access carefully
- encrypt at rest when appropriate
- log sensitive access
- avoid sharing results more widely than needed

---

## 8. System Integration

The questionnaire becomes much more valuable when it connects to the rest of the platform.

### A. Connection with AI models

In the current MindBridge project, the questionnaire is connected to AI in an **indirect** way.

What it currently does:

- a medium assessment result recommends using AI chat
- onboarding context helps shape the broader patient experience

What it does not strongly do yet:

- send the saved assessment answers directly into the AI chat prompt
- automatically adapt AI replies based on the last assessment result
- generate personalized care summaries from the questionnaire

So today the questionnaire is a **gateway to AI support**, not a deep AI memory system.

### B. Connection with doctors or dashboards

The questionnaire is strongly connected to the **patient dashboard**.

The dashboard can show:

- latest assessment
- recommendation text
- a path to review the result

The questionnaire is also connected to patient support workflows such as:

- profile completion
- appointment readiness
- SOS setup

Doctor connection is currently weaker.

The project already supports:

- doctor browsing
- doctor booking
- doctor appointment views

But the present doctor dashboard does not appear to deeply display questionnaire answers or assessment trends.

That means questionnaire-to-doctor integration is still a good future enhancement area.

### C. Connection with recommendation systems

This is where the current questionnaire system is strongest.

MindBridge already behaves like a simple recommendation engine:

- low score -> calming activities
- medium score -> AI chat
- high score -> doctor support

This is a very practical pattern because it turns vague emotional data into a concrete next step.

In product terms, this is a **triage-style support recommendation**, not a diagnosis engine.

---

## 9. Example Full Questionnaire Flow

This example shows how a real patient might experience the system from start to finish.

### Patient story

Imagine a new patient named **Aisha** signs up for MindBridge.

She wants support because she has been feeling stressed, lonely, and unable to sleep well.

### Step 1: Sign up

Aisha creates a patient account.

Because she is new, MindBridge sends her to onboarding before the dashboard.

### Step 2: Onboarding - Basic info

MindBridge asks:

- Name: "What should we call you?"
- Age
- Gender

Aisha answers:

- Name: Aisha
- Age: 24
- Gender: Woman

### Step 3: Onboarding - Emotional context

MindBridge asks:

- "What would you like us to know?"

Aisha writes:

- "I have been feeling stressed for the last few weeks. I struggle to switch off at night and I feel alone sometimes."

### Step 4: Onboarding - Emergency contact

MindBridge asks for a trusted person.

Aisha answers:

- Guardian or trusted person: Nadeera
- Email: nadeera@example.com
- Phone: +94 77 123 4567

### Step 5: Onboarding - Consent

MindBridge explains:

- this is a support platform
- it is not emergency care
- it is not a diagnosis system
- the information will be stored to personalize her experience

Aisha accepts the consent checkbox and finishes onboarding.

### Step 6: Dashboard entry

Aisha now reaches the dashboard.

She sees that she can:

- open AI chat
- take an assessment
- explore calming activities
- find a doctor

She chooses the short assessment.

### Step 7: Assessment questions

MindBridge shows six questions, one at a time.

### Question 1

"Over the last two weeks, how often have you felt emotionally stretched or overwhelmed?"

Aisha answers:

- More than half the days

Score added:

- 2

### Question 2

"How often has sleep felt difficult or less restorative than usual?"

Aisha answers:

- Nearly every day

Score added:

- 3

### Question 3

"How often have everyday activities felt harder to start or enjoy?"

Aisha answers:

- A few days

Score added:

- 1

### Question 4

"How often have you felt alone with what you're carrying?"

Aisha answers:

- More than half the days

Score added:

- 2

### Question 5

"How often has it been hard to focus on study, work, or regular tasks?"

Aisha answers:

- A few days

Score added:

- 1

### Question 6

"How often have you struggled to return to a calm baseline after stress?"

Aisha answers:

- A few days

Score added:

- 1

### Step 8: Score calculation

Total score:

- 2 + 3 + 1 + 2 + 1 + 1 = **10**

Current MindBridge classification rule:

- 0 to 4 = low
- 5 to 8 = medium
- 9 or more = high

So Aisha receives:

- **High support recommendation**

### Step 9: Result page

MindBridge shows:

- support level: High
- score: 10
- guidance text explaining that more direct human support may help

It then offers the next step:

- Find a doctor

### Step 10: Ongoing use

Later, Aisha returns to the dashboard.

Now the system can show her latest assessment result and continue guiding her toward:

- doctor booking
- calming activities
- AI chat if she wants reflective support

This example shows the full value of the questionnaire system:

- intake
- check-in
- scoring
- recommendation
- ongoing support

---

## 10. Best Practices and Improvements

This section is especially useful for someone who wants to design or build a system like this from scratch.

### Best practices already reflected in MindBridge

- Keep the first questionnaire short.
- Use simple language instead of clinical jargon.
- Separate onboarding from recurring check-ins.
- Show progress clearly.
- Explain that results are guidance, not diagnosis.
- Convert answers into a clear next step.
- Collect safety contact information early.
- Store ongoing assessments separately from long-term profile data.

### Practical improvements for MindBridge

#### 1. Add a dedicated Goals step

The system should ask what the patient wants help with most.

Examples:

- "What would you most like to improve right now?"
- "What feels most urgent: sleep, stress, motivation, loneliness, or talking to a professional?"

Why it helps:

- makes support more patient-centered
- helps AI and recommendations feel more relevant

#### 2. Expand lifestyle questions carefully

MindBridge already touches sleep, but could improve with structured lifestyle questions such as:

- sleep routine
- exercise frequency
- eating habits
- caffeine or alcohol use
- time spent resting or recovering

Why it helps:

- lifestyle patterns strongly affect mental wellbeing
- doctors and wellness tools benefit from this context

#### 3. Add true conditional branching

Examples:

- if sleep is a major issue, ask a short sleep follow-up
- if the patient reports feeling very alone, suggest community or support options earlier
- if the patient reports very high distress, show urgent support options immediately

Why it helps:

- makes the questionnaire smarter
- avoids asking every patient the same follow-up questions

#### 4. Make required vs optional fields clearer

Right now some rules are enforced, but the screen could communicate them more clearly.

Examples:

- label optional text explicitly as optional
- mark required fields visually
- explain why emergency contact is needed

#### 5. Save draft progress

Healthcare forms are often interrupted.

MindBridge would benefit from:

- draft saving
- resume later support
- partial completion recovery

#### 6. Show answer history over time

Assessments become more useful when the patient can see change over time.

Example features:

- weekly check-in history
- trend graph
- repeated symptom pattern tracking

Why it helps:

- supports self-awareness
- helps doctors review progress
- makes the assessment more than a one-time score

#### 7. Strengthen doctor integration

If the patient consents, the system could summarize relevant questionnaire insights for doctors.

Examples:

- recent support level
- major concern areas
- repeated sleep issues
- patient-stated goals

This would make the questionnaire more clinically useful while still respecting consent boundaries.

#### 8. Align privacy protections across all patient intake routes

This is an important engineering improvement.

The project already has privacy classification and encryption support, but the onboarding route should be reviewed to ensure it protects sensitive data in the same strong way as the broader profile route.

Assessment records should also be reviewed under the same sensitivity standard.

### Common mistakes to avoid

#### Mistake 1: Asking too much too early

If the first experience feels too long, patients may abandon the process.

Avoid:

- giant forms
- too many open-ended questions
- unnecessary medical detail at the start

#### Mistake 2: Using diagnostic language too early

Patients may feel judged or frightened if the questionnaire sounds like a test.

Avoid wording like:

- "What disorder do you think you have?"

Prefer wording like:

- "How have you been feeling lately?"

#### Mistake 3: Collecting data without explaining why

Patients are more willing to answer when they understand the purpose.

Always explain:

- why the question matters
- how it will help them
- how the data will be protected

#### Mistake 4: Treating every answer the same

A good health questionnaire should change what happens next.

If the result never affects recommendations, patients may feel the form was pointless.

#### Mistake 5: Ignoring privacy

Mental health information is sensitive.

Never assume it can be handled like ordinary preference data.

#### Mistake 6: Forgetting emotional design

In healthcare products, the tone of the questionnaire matters almost as much as the fields themselves.

Cold or robotic wording can reduce trust and honesty.

---

## Final summary

The MindBridge Patient Questionnaire System is best understood as a **three-part support structure**:

1. **Onboarding intake**
   Collects basic identity, safety, and context information.

2. **Short emotional assessment**
   Measures current distress using a small, structured check-in.

3. **Longer-term profile data**
   Supports broader care coordination such as emergency contact details and medical context.

Its strongest current strengths are:

- clear step-based onboarding
- emotionally gentle language
- short repeatable assessment
- practical next-step recommendations
- solid connection to the patient dashboard

Its biggest current opportunities are:

- deeper goals and lifestyle capture
- stronger conditional branching
- better doctor integration
- stronger consistency in sensitive data protection

For a beginner building a similar system from scratch, the most important lesson is this:

> A good patient questionnaire is not just a form. It is a trust-building, decision-guiding, privacy-sensitive experience that helps the patient move toward the right kind of support.
