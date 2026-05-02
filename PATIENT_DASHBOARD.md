# Flutter Patient Dashboard Implementation

This document provides a comprehensive guide to the Flutter patient dashboard that mirrors the web implementation for the MindBridge mental health app.

## Overview

The Flutter mobile patient dashboard provides a unified interface for patients who have completed onboarding. It includes:
- Summary statistics (available activities, upcoming appointments, doctors)
- Quick access cards for main features
- Assessment results and recommendations
- Upcoming appointments display
- SOS emergency button

## Project Structure

### New Files Created

#### Services
- **`lib/services/patient_service.dart`** - API client for patient-specific endpoints
  - `getDashboardData()` - Fetches dashboard data from `/api/patient/dashboard`
  - `isOnboardingCompleted()` - Checks onboarding status
  - `triggerSos()` - Sends emergency alert to guardian

#### Components
- **`lib/components/SummaryCard.dart`** - Displays metrics (activities, appointments, doctors count)
- **`lib/components/DashboardFeatureCard.dart`** - Feature cards with gradient backgrounds (AI Chat, Assessments, etc.)
- **`lib/components/PatientDashboardCards.dart`** - Appointment and assessment display cards
- **`lib/components/PatientShell.dart`** - Navigation layout (sidebar/bottom nav) for patient pages

#### Pages
- **`lib/screen/patient_dashboard_page.dart`** - Main dashboard page with all sections
- **`lib/screen/placeholder_pages.dart`** - Placeholder pages for future features (Assessments, Activities, Community, Doctors, Appointments)

### Updated Files
- **`lib/main.dart`** - Added patient dashboard and feature routes
- **`lib/screen/home.dart`** - Auto-navigates to dashboard if user is logged in and onboarded
- **`lib/screen/onboarding_page.dart`** - Navigates to dashboard after completing onboarding (instead of home)

## Navigation Flow

### Login/Signup Flow
```
1. User opens app → HomePage
2. If logged in + onboarded → Auto-redirect to PatientDashboardPage
3. If logged in but not onboarded → OnboardingPage
4. If not logged in → Show home page with login/signup buttons
```

### User Journey
```
New User:
  Sign Up (Patient) → Onboarding (4 steps) → Patient Dashboard → Features

Returning User:
  Home Page (auto-check) → Patient Dashboard
```

## Backend API Integration

### Endpoint: `GET /api/patient/dashboard`
**Authentication**: Required (JWT token)

**Response Structure**:
```json
{
  "onboardingCompleted": true,
  "latestAssessment": {
    "_id": "assessment-id",
    "classification": "medium",
    "recommendation": "Your responses suggest...",
    "nextStep": "chat"
  },
  "activityCount": 3,
  "upcomingAppointments": [
    {
      "_id": "apt-id",
      "doctorName": "Dr. Jane Doe",
      "date": "2024-05-10",
      "time": "2:00 PM"
    }
  ],
  "doctorCount": 5
}
```

### Endpoint: `POST /api/patient/sos`
**Authentication**: Required
**Body** (optional):
```json
{
  "message": "I need help"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Guardian notified"
}
```

## Component Details

### PatientDashboardPage
Main dashboard widget with:
- AppBar with SOS button
- Summary cards grid (3-column responsive)
- Feature cards grid (2-column responsive)
- Assessment result card with recommendation
- Upcoming appointments list with button

**Data Flow**:
1. Fetches `DashboardData` from `PatientService`
2. Displays data in various card components
3. Provides navigation to feature pages
4. Handles SOS dialog and submission

### PatientShell
Navigation wrapper for patient pages:
- **Desktop**: Sidebar navigation rail
- **Mobile**: Bottom navigation bar
- Auto-switches based on screen width (768px breakpoint)

## Styling & Design System

The dashboard follows the web design with:
- **Colors**: Teal/turquoise primary (`#2E7D7D`), gray text (`#6B7280`), light backgrounds
- **Spacing**: 24px main padding, 16px component spacing
- **Shadows**: Soft shadows for card elevation (`color.withOpacity(0.05)`)
- **Border Radius**: 20-24px for cards, 12-16px for buttons
- **Typography**: Poppins font for headers, default for body

## Future Implementation

### Placeholder Routes (Ready for Development)
1. **`/assessments`** - Assessment questionnaire and history
2. **`/activities`** - Breathing exercises, grounding techniques, reflection tools
3. **`/community`** - Community posts and engagement
4. **`/doctors`** - Doctor profiles and appointment booking
5. **`/appointments`** - View and manage doctor appointments

Each has a route in `main.dart` and can be enhanced with full functionality.

## Usage Examples

### Accessing Dashboard
```dart
// After login/onboarding, navigate to:
Navigator.pushNamed(context, '/patient-dashboard');
```

### Fetching Dashboard Data
```dart
final patientService = PatientService();
final dashboardData = await patientService.getDashboardData();
```

### Triggering SOS
```dart
try {
  await patientService.triggerSos(message: 'I need help');
  // Show success message
} catch (e) {
  // Handle error
}
```

## Integration Checklist

- [x] PatientService with API endpoints
- [x] Dashboard page and components
- [x] PatientShell navigation
- [x] Auto-redirect from home if onboarded
- [x] Onboarding → Dashboard navigation
- [x] SOS functionality
- [x] Responsive design (mobile/tablet/desktop)
- [x] Placeholder pages for future features
- [ ] Implement assessments page with questionnaire
- [ ] Implement activities page with timers
- [ ] Implement community posts
- [ ] Implement doctor search and booking
- [ ] Implement appointment management

## API Error Handling

The dashboard gracefully handles errors:
1. **Loading**: Shows circular progress indicator
2. **Error**: Shows error message with retry button
3. **No Data**: Shows empty state messages (e.g., "No appointments booked yet")
4. **Network Issues**: Shows error with retry option

## Environment Configuration

The API base URL is configured via:
- **Web**: `http://localhost:3000`
- **Mobile (Emulator)**: `http://10.0.2.2:3000`
- **Mobile (Physical Device)**: Update in `api_client.dart`

## Backend Verification

Before deploying the Flutter app, ensure:
1. `/api/patient/dashboard` endpoint is working (test with curl/Postman)
2. Patient has `view_own_profile` permission
3. `POSTGRES_HOST` and database connection are configured
4. Ollama is running if using AI features
5. Guardian contact is saved in patient profile for SOS

## Testing

Test the complete flow:
```
1. Create new account with patient role
2. Complete onboarding (4 steps)
3. Verify redirect to dashboard
4. Check dashboard displays correct data
5. Test navigation to feature pages
6. Test SOS dialog and submission
```

---

**Note**: This implementation is a complete mirror of the web dashboard. Future feature development (Assessments, Activities, Community, Doctors, Appointments) should follow the same design patterns and API integration approach.
