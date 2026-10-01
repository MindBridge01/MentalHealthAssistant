import 'package:flutter/material.dart';
import 'screen/home.dart';
import 'screen/auth_window.dart';
import 'screen/profile_settings_page.dart';
import 'screen/onboarding_page.dart';
import 'screen/ai_chat_page.dart';
import 'screen/patient_dashboard_page.dart';
import 'screen/placeholder_pages.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MindBridge',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E2F6B)),
        useMaterial3: true,
      ),
      debugShowCheckedModeBanner: false,
      home: const HomePage(),
      routes: {
        '/home': (_) => const HomePage(),
        '/login': (_) => const AuthWindow(mode: AuthMode.login),
        '/signup': (_) => const AuthWindow(mode: AuthMode.signup),
        '/ai-chat': (_) => const AiChatPage(),
        '/patient-dashboard': (_) => const PatientDashboardPage(),
        '/assessments': (_) => const AssessmentsPage(),
        '/activities': (_) => const ActivitiesPage(),
        '/community': (_) => const CommunityPage(),
        '/doctors': (_) => const DoctorsPage(),
        '/appointments': (_) => const AppointmentsPage(),
        '/profile-settings': (context) {
          final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
          final isOnboarding = args?['onboarding'] as bool? ?? false;
          return ProfileSettingsPage(isOnboarding: isOnboarding);
        },
        '/onboarding': (_) => const OnboardingPage(),
      },
    );
  }
}
