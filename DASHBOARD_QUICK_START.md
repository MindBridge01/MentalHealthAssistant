# Patient Dashboard Implementation - Quick Start

## 🎯 What You Get

A complete Flutter patient dashboard that mirrors your web implementation. When patients login or signup:

```
Patient Signup/Login Flow:
┌─────────────┐
│   Sign Up   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Onboarding (4 steps)       │
│  - Basic info               │
│  - Mental health context    │
│  - Guardian contact         │
│  - Consent agreement        │
└──────┬──────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Patient Dashboard                       │
│  ├─ Summary Cards (3)                    │
│  │  ├─ Available Activities               │
│  │  ├─ Upcoming Appointments             │
│  │  └─ Doctors to Explore                │
│  ├─ Feature Cards (4)                    │
│  │  ├─ AI Chat                           │
│  │  ├─ Take Assessment                   │
│  │  ├─ Explore Activities                │
│  │  └─ Find a Doctor                     │
│  ├─ Latest Assessment Section            │
│  └─ Upcoming Appointments Section        │
└──────────────────────────────────────────┘
```

## 📂 Files Created

### Services
- **`lib/services/patient_service.dart`** (110 lines)
  - Fetches dashboard data from backend
  - Checks onboarding completion
  - Sends SOS alerts

### Components
- **`lib/components/SummaryCard.dart`** (53 lines)
  - Shows metric cards (count + hint text)
  
- **`lib/components/DashboardFeatureCard.dart`** (91 lines)
  - Feature cards with gradients and tap handlers
  
- **`lib/components/PatientDashboardCards.dart`** (182 lines)
  - Appointment items list
  - Assessment result card with recommendation
  
- **`lib/components/PatientShell.dart`** (132 lines)
  - Sidebar navigation (tablet/desktop)
  - Bottom navigation (mobile)
  - 7 navigation tabs

### Pages
- **`lib/screen/patient_dashboard_page.dart`** (338 lines)
  - Main dashboard with all sections
  - Responsive layout (mobile/tablet/desktop)
  - FutureBuilder for data loading
  - SOS dialog with confirmation
  
- **`lib/screen/placeholder_pages.dart`** (69 lines)
  - 5 placeholder pages ready for implementation

## 🔄 Navigation Routes

All routes automatically added to `main.dart`:

```
/home                    → HomePage (auto-redirects if onboarded)
/login                   → AuthWindow (login mode)
/signup                  → AuthWindow (signup mode)
/onboarding              → OnboardingPage (patient only)
/patient-dashboard       → PatientDashboardPage ✨ NEW
/assessments             → AssessmentsPage (placeholder)
/activities              → ActivitiesPage (placeholder)
/community               → CommunityPage (placeholder)
/doctors                 → DoctorsPage (placeholder)
/appointments            → AppointmentsPage (placeholder)
/ai-chat                 → AiChatPage (existing)
/profile-settings        → ProfileSettingsPage (existing)
```

## 🚀 How It Works

### 1. User Signs Up
```dart
AuthWindow(mode: AuthMode.signup) 
  → Calls /api/auth/signup
  → Navigates to OnboardingPage
```

### 2. User Completes Onboarding
```dart
OnboardingPage
  → Saves data to /api/profile
  → Navigates to PatientDashboardPage ✨ NEW BEHAVIOR
  // Previously navigated to /home
```

### 3. Dashboard Loads
```dart
PatientDashboardPage
  → Fetches from /api/patient/dashboard
  → Displays:
     - 3 Summary Cards
     - 4 Feature Cards
     - Latest Assessment
     - Upcoming Appointments
```

### 4. User Logs Back In
```dart
HomePage
  → Checks if logged in via SharedPreferences
  → Checks if onboarded via /api/patient/dashboard
  → Auto-redirects to PatientDashboardPage
  // User doesn't see home page if already onboarded
```

## 📊 Dashboard Sections

### Summary Cards (3 columns, responsive)
```
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Available Activities │ │ Upcoming Appts   │ │ Doctors to ...   │
│        3             │ │        2         │ │        5         │
│ "Breathing, ground..." │ │ "Your next..." │ │ "Browse..." │
└──────────────────────┘ └──────────────────┘ └──────────────────┘
```

### Feature Cards (2-4 columns, responsive)
```
┌────────────────────┐ ┌────────────────────┐
│ 🧠 AI Chat         │ │ 📝 Assessment      │
│ "Reflect with..." │ │ "Check-in guide..." │
└────────────────────┘ └────────────────────┘

┌────────────────────┐ ┌────────────────────┐
│ 🧘 Activities      │ │ ⚕️  Doctors        │
│ "Breathing tools..." │ │ "Browse & book..." │
└────────────────────┘ └────────────────────┘
```

### Latest Assessment
```
┌─────────────────────────────────────────┐
│ LATEST ASSESSMENT                       │
│ MEDIUM Support Recommendation           │
│                                         │
│ "Your responses suggest you may benefit │
│  from extra support..."                 │
│                                         │
│ [Review Result] button                  │
└─────────────────────────────────────────┘
```

### Upcoming Appointments
```
┌─────────────────────────────────────────┐
│ UPCOMING APPOINTMENTS                   │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ Dr. Jane Doe                      │   │
│ │ 2024-05-15 • 2:00 PM             │   │
│ └───────────────────────────────────┘   │
│                                         │
│ [View All Appointments]                 │
└─────────────────────────────────────────┘
```

## 🔧 Backend API Required

### Dashboard Endpoint
```
GET /api/patient/dashboard
Authorization: Bearer {token}

Response: {
  "onboardingCompleted": true,
  "latestAssessment": {
    "_id": "...",
    "classification": "medium",
    "recommendation": "...",
    "nextStep": "chat"
  },
  "activityCount": 3,
  "upcomingAppointments": [
    {
      "_id": "...",
      "doctorName": "Dr. Jane",
      "date": "2024-05-15",
      "time": "2:00 PM"
    }
  ],
  "doctorCount": 5
}
```

### SOS Endpoint
```
POST /api/patient/sos
Authorization: Bearer {token}
Body: { "message": "I need help" } (optional)

Response: { "success": true }
```

## ✅ Verification Checklist

- [ ] Backend server running (`node server.js`)
- [ ] Postgres connected (no ENOTFOUND errors)
- [ ] Ollama running if using chat features
- [ ] `/api/patient/dashboard` endpoint works
- [ ] `/api/patient/sos` endpoint works
- [ ] Flutter app can login as patient
- [ ] Onboarding completes and navigates to dashboard
- [ ] Dashboard data displays correctly
- [ ] Feature cards navigate to their pages
- [ ] SOS button opens dialog and sends alert

## 🎨 Design System

All components follow the web design:
- **Primary Color**: `#2E7D7D` (Teal)
- **Text**: `#1F2937` (Dark gray)
- **Muted**: `#6B7280` (Medium gray)
- **Background**: `#F3F4F6` / `#F9FAFB` (Light gray)
- **Border Radius**: 20-24px for cards, 12-16px for buttons
- **Shadows**: Soft shadows with opacity 0.05
- **Font**: Poppins for headers, default for body

## 📱 Responsive Behavior

- **Mobile** (< 600px):
  - 1-column layout for summary cards
  - 1-column layout for feature cards
  - Bottom navigation bar (7 items)
  - Vertical assessment + appointments

- **Tablet** (600-768px):
  - 2-column layout for feature cards
  - 3-column layout for summary cards
  - Bottom navigation bar

- **Desktop** (> 768px):
  - Sidebar navigation rail
  - Full width layout
  - All cards visible at once

## 🔜 Next Steps

1. **Test the Dashboard**
   ```bash
   # Make sure backend is running
   cd E:\mentalhealth\MentalHealthAssistant\mentalhealth\mentalhealth\server
   node server.js
   ```

2. **Run Flutter App**
   ```bash
   cd E:\mentalhealth\mindbridge_mobile
   flutter run
   ```

3. **Complete User Journey**
   - Sign up as patient
   - Complete onboarding
   - Verify dashboard loads

4. **Implement Remaining Features** (See `DASHBOARD_FEATURES_MAPPING.md`)
   - Assessments page
   - Activities page
   - Community page
   - Doctors page
   - Appointments page

## 🚦 Testing SOS Feature

To verify SOS works:
1. Click "SOS" button in app bar
2. Confirm in dialog
3. Should show success snackbar
4. Backend should send notification to guardian

## 💡 Key Implementation Highlights

✨ **Auto-Redirect**: Users logged in + onboarded automatically see dashboard, not home page

✨ **Responsive Navigation**: Sidebar on desktop, bottom nav on mobile, all using same `PatientShell`

✨ **Mirrored Design**: Flutter components match web design exactly (colors, spacing, fonts)

✨ **Ready for Features**: 5 placeholder pages with correct routes ready to be implemented

✨ **Error Handling**: Graceful handling of network errors, loading states, empty states

---

**Questions?** See `PATIENT_DASHBOARD.md` and `DASHBOARD_FEATURES_MAPPING.md` for detailed documentation.
