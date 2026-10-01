import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class DashboardAppointment {
  const DashboardAppointment({
    required this.id,
    required this.doctorName,
    required this.date,
    required this.time,
  });

  final String id;
  final String doctorName;
  final String date;
  final String time;

  factory DashboardAppointment.fromJson(Map<String, dynamic> json) {
    return DashboardAppointment(
      id: json['_id'] ?? json['id'] ?? '',
      doctorName: json['doctorName'] ?? 'MindBridge Doctor',
      date: json['date'] ?? '',
      time: json['time'] ?? '',
    );
  }
}

class AssessmentResult {
  const AssessmentResult({
    required this.id,
    required this.classification,
    required this.recommendation,
    required this.nextStep,
  });

  final String id;
  final String classification; // 'low', 'medium', 'high'
  final String recommendation;
  final String nextStep; // 'activities', 'chat', 'doctor'

  factory AssessmentResult.fromJson(Map<String, dynamic> json) {
    return AssessmentResult(
      id: json['_id'] ?? json['id'] ?? '',
      classification: json['classification'] ?? 'medium',
      recommendation: json['recommendation'] ?? 'Start with AI chat or activities.',
      nextStep: json['nextStep'] ?? 'chat',
    );
  }
}

class DashboardData {
  const DashboardData({
    required this.onboardingCompleted,
    this.latestAssessment,
    required this.activityCount,
    required this.upcomingAppointments,
    required this.doctorCount,
  });

  final bool onboardingCompleted;
  final AssessmentResult? latestAssessment;
  final int activityCount;
  final List<DashboardAppointment> upcomingAppointments;
  final int doctorCount;

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final rawAppointments = json['upcomingAppointments'] as List<dynamic>? ?? [];
    final appointments = rawAppointments
        .whereType<Map<String, dynamic>>()
        .map(DashboardAppointment.fromJson)
        .toList();

    final rawAssessment = json['latestAssessment'] as Map<String, dynamic>?;
    final assessment = rawAssessment != null
        ? AssessmentResult.fromJson(rawAssessment)
        : null;

    return DashboardData(
      onboardingCompleted: json['onboardingCompleted'] ?? false,
      latestAssessment: assessment,
      activityCount: json['activityCount'] ?? 0,
      upcomingAppointments: appointments,
      doctorCount: json['doctorCount'] ?? 0,
    );
  }
}

class PatientService {
  PatientService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  /// Fetch dashboard data for authenticated patient
  Future<DashboardData> getDashboardData() async {
    final token = await _client.readToken();
    if (token == null || token.isEmpty) {
      throw Exception('Not authenticated');
    }

    final response = await _client.getJson(
      Uri.parse('$_defaultBaseUrl/api/patient/dashboard'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load dashboard data: ${response.statusCode}');
    }

    if (response.body.isEmpty) {
      throw Exception('Empty response from server');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return DashboardData.fromJson(decoded);
  }

  /// Check if patient has completed onboarding
  Future<bool> isOnboardingCompleted() async {
    try {
      final data = await getDashboardData();
      return data.onboardingCompleted;
    } catch (_) {
      return false;
    }
  }

  /// Trigger SOS - notify guardian
  Future<Map<String, dynamic>> triggerSos({
    String? message,
  }) async {
    final token = await _client.readToken();
    if (token == null || token.isEmpty) {
      throw Exception('Not authenticated');
    }

    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/patient/sos'),
      body: {
        if (message != null) 'message': message,
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to trigger SOS');
    }

    if (response.body.isEmpty) {
      return {'success': true};
    }

    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic>
        ? decoded
        : {'success': true};
  }
}
