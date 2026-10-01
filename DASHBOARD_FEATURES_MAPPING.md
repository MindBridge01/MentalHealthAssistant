# Patient Dashboard - Web to Mobile Feature Mapping

This document maps the web patient dashboard features to the Flutter mobile implementation and shows which backend routes should be called.

## Dashboard Structure Comparison

### Web Dashboard (React)
**File**: `client/src/pages/patient/DashboardPage.jsx`
**Route**: `/patient/dashboard`

**Components Used**:
- `PatientShell` - Layout wrapper
- `PageHeader` - Title and description
- `SummaryCard` - Statistics
- `FeatureCard` - Quick access cards
- Custom cards for assessment and appointments

### Flutter Dashboard (Dart)
**File**: `lib/screen/patient_dashboard_page.dart`
**Route**: `/patient-dashboard`

**Components Used**:
- `PatientShell` - Navigation layout
- `SummaryCard` - Statistics display
- `DashboardFeatureCard` - Feature cards
- `AssessmentCard` - Assessment results
- `AppointmentItem` - Appointment display

## Feature Mapping & Backend Routes

### 1. AI Chat
**Web**: `/patient/chat`
**Mobile**: `/ai-chat`
**Current**: ✅ Implemented (`AiChatPage`)
**Backend Routes**:
- `POST /api/chat` - Send authenticated message
- `POST /api/public-chat` - Send public message

### 2. Assessments
**Web**: `/patient/assessments`
**Mobile**: `/assessments` (Placeholder)
**Status**: 🟡 Placeholder created, full implementation needed
**Backend Routes** (from web):
- `GET /api/patient/assessments` - List assessments
- `POST /api/patient/assessments` - Create assessment
- `GET /api/patient/assessments/:id` - Get assessment details

**Web Implementation** (`client/src/pages/patient/AssessmentPage.jsx`):
- Questionnaire form with multiple questions
- Scoring system (0-10 scale)
- Result display with classification (low/medium/high)
- Recommendations based on score

**Todo for Mobile**:
```dart
// Implement AssessmentPage with:
// 1. Load assessment questions from /api/patient/assessments endpoint
// 2. Display questionnaire form
// 3. Submit answers to POST /api/patient/assessments
// 4. Show result with classification and recommendation
```

### 3. Activities
**Web**: `/patient/activities`
**Mobile**: `/activities` (Placeholder)
**Status**: 🟡 Placeholder created, full implementation needed

**Backend Routes** (from web):
- `GET /api/patient/activities` - List available activities

**Web Activities** (hardcoded in backend):
1. **Breathing Reset** - 4 min, Breathing category
   - 4-4-6 breathing rhythm exercise
2. **5-4-3-2-1 Grounding** - 6 min, Grounding category
   - Sensory awareness exercise
3. **Evening Unwind** - 8 min, Reflection category
   - Reflective journaling exercise

**Components Already Built**:
- `ActivityTimer` - Timer with circular progress (web)
- `breathing_circle.dart` - Animated breathing visual (mobile)

**Todo for Mobile**:
```dart
// Implement ActivitiesPage with:
// 1. Fetch activities from /api/patient/activities
// 2. Display activity cards with duration and category
// 3. Show ActivityTimer when activity is selected
// 4. Include steps/guidance for each activity
// 5. Save completion status
```

### 4. Community
**Web**: `/patient/community`
**Mobile**: `/community` (Placeholder)
**Status**: 🟡 Placeholder created, full implementation needed

**Backend Routes** (from web):
- `GET /api/community/posts` - List community posts
- `POST /api/community/posts` - Create post
- `POST /api/community/posts/:id/like` - Like post
- `POST /api/community/posts/:id/comment` - Add comment

**Web Component**: `PostCard` - Shows posts with likes, comments, images

**Todo for Mobile**:
```dart
// Implement CommunityPage with:
// 1. Fetch posts from /api/community/posts
// 2. Display posts in list (PostCard equivalent)
// 3. Show post author, location, timestamp
// 4. Display images if present
// 5. Like and comment functionality
// 6. Toggle save post
// 7. Create new post option
```

### 5. Find Doctors
**Web**: `/patient/doctors`
**Mobile**: `/doctors` (Placeholder)
**Status**: 🟡 Placeholder created, full implementation needed

**Backend Routes** (from web):
- `GET /api/doctor` - List all doctors
- `GET /api/doctor/:id` - Get doctor profile
- `POST /api/appointment/book` - Book appointment

**Web Component**: `DoctorCard` - Shows doctor info and book button

**Todo for Mobile**:
```dart
// Implement DoctorsPage with:
// 1. Fetch doctors from /api/doctor
// 2. Display doctor cards with:
//    - Avatar/initials
//    - Name and specialty
//    - Bio
//    - Number of open slots
// 3. Show doctor profile on tap
// 4. Display available time slots
// 5. Allow booking appointment
```

### 6. Appointments
**Web**: `/patient/appointments`
**Mobile**: `/appointments` (Placeholder)
**Status**: 🟡 Placeholder created, full implementation needed

**Backend Routes** (from web):
- `GET /api/appointment` - List appointments
- `GET /api/appointment/:id` - Get appointment details
- `PUT /api/appointment/:id` - Update appointment
- `DELETE /api/appointment/:id` - Cancel appointment

**Todo for Mobile**:
```dart
// Implement AppointmentsPage with:
// 1. Fetch appointments from /api/appointment
// 2. Display list with:
//    - Doctor name
//    - Date and time
//    - Status (upcoming/past)
// 3. Show reschedule button
// 4. Show cancel button
// 5. Show appointment details on tap
```

## Navigation Routes Setup

All routes are already added to `main.dart`:

```dart
routes: {
  '/patient-dashboard': (_) => const PatientDashboardPage(),
  '/assessments': (_) => const AssessmentsPage(),
  '/activities': (_) => const ActivitiesPage(),
  '/community': (_) => const CommunityPage(),
  '/doctors': (_) => const DoctorsPage(),
  '/appointments': (_) => const AppointmentsPage(),
  // ... other routes
}
```

## PatientShell Navigation

The `PatientShell` widget provides navigation between these pages:

**Desktop/Tablet**: Sidebar with 7 items
**Mobile**: Bottom navigation bar with 7 items

```dart
enum PatientNavTab {
  dashboard,    // /patient-dashboard
  chat,         // /ai-chat
  assessments,  // /assessments
  activities,   // /activities
  community,    // /community
  doctors,      // /doctors
  appointments, // /appointments
}
```

## Implementation Pattern

For each placeholder page, follow this pattern:

### 1. Create Service Class
```dart
// lib/services/assessments_service.dart
class AssessmentService {
  Future<List<Assessment>> getAssessments() async {
    final response = await _client.getJson(
      Uri.parse('$_baseUrl/api/patient/assessments'),
    );
    // Parse and return
  }
}
```

### 2. Create Data Model
```dart
class Assessment {
  final String id;
  final String question;
  final int score;
  // ... other fields
  
  factory Assessment.fromJson(Map<String, dynamic> json) {
    // Parse JSON
  }
}
```

### 3. Create Page Widget
```dart
class AssessmentsPage extends StatefulWidget {
  const AssessmentsPage({super.key});

  @override
  State<AssessmentsPage> createState() => _AssessmentsPageState();
}

class _AssessmentsPageState extends State<AssessmentsPage> {
  late Future<List<Assessment>> _assessmentsFuture;

  @override
  void initState() {
    super.initState();
    _assessmentsFuture = AssessmentService().getAssessments();
  }

  @override
  Widget build(BuildContext context) {
    return PatientShell(
      currentTab: PatientNavTab.assessments,
      child: Scaffold(
        appBar: AppBar(title: const Text('Assessments')),
        body: FutureBuilder<List<Assessment>>(
          future: _assessmentsFuture,
          builder: (context, snapshot) {
            if (snapshot.hasError) return ErrorWidget(error: snapshot.error);
            if (!snapshot.hasData) return const LoadingWidget();
            // Display list
          },
        ),
      ),
    );
  }
}
```

### 4. Create Component Cards
Follow the style of `DashboardFeatureCard.dart`:
- Use gradient backgrounds for visual interest
- White semi-transparent cards with shadows
- Rounded borders (20-24px)
- Tap handlers for navigation

### 5. Add to Router
Already done in `main.dart`

## Backend Verification Checklist

Before implementing each page, verify the backend endpoints:

```bash
# 1. Check dashboard endpoint
curl http://localhost:3000/api/patient/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Check activities
curl http://localhost:3000/api/patient/activities \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Check doctors
curl http://localhost:3000/api/doctor \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Check appointments
curl http://localhost:3000/api/appointment \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Check assessments
curl http://localhost:3000/api/patient/assessments \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Check community
curl http://localhost:3000/api/community/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Design Consistency

Maintain consistency with the dashboard:

**Colors**:
- Primary: `Color(0xFF2E7D7D)` (Teal)
- Text: `Color(0xFF1F2937)` (Dark Gray)
- Muted: `Color(0xFF6B7280)` (Medium Gray)
- Surface: `Color(0xFFF3F4F6)` (Light Gray)

**Typography**:
- Headers: Poppins, 20-24px, bold
- Subheaders: 16-18px, w600
- Body: 13-14px, w400
- Labels: 12px, w600, uppercase, letter-spacing 0.5

**Spacing**:
- Page padding: 16px
- Section spacing: 24px
- Component spacing: 16px
- Card padding: 20-24px

**Components**:
- Cards: `BorderRadius.circular(20-24)`
- Buttons: `BorderRadius.circular(12-16)`
- Shadows: `Colors.black.withOpacity(0.05)` with blur 12

## Summary

- ✅ Dashboard: Complete
- ✅ AI Chat: Complete
- 🟡 Assessments: Routes setup, implementation needed
- 🟡 Activities: Routes setup, implementation needed
- 🟡 Community: Routes setup, implementation needed
- 🟡 Doctors: Routes setup, implementation needed
- 🟡 Appointments: Routes setup, implementation needed

All placeholder pages are ready to be replaced with full implementations following the patterns above.
