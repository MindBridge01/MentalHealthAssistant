import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

// Activity Model
class Activity {
  const Activity({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.durationMinutes,
    required this.intensity,
    required this.steps,
  });

  final String id;
  final String title;
  final String category;
  final String description;
  final int durationMinutes;
  final String intensity;
  final List<String> steps;

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? '',
      description: json['description'] ?? '',
      durationMinutes: json['durationMinutes'] ?? 0,
      intensity: json['intensity'] ?? 'Moderate',
      steps: List<String>.from(json['steps'] ?? []),
    );
  }
}

// Assessment Response Model
class AssessmentResponse {
  const AssessmentResponse({
    required this.questionId,
    required this.question,
    required this.score,
  });

  final String questionId;
  final String question;
  final int score;

  Map<String, dynamic> toJson() => {
    'questionId': questionId,
    'question': question,
    'score': score,
  };
}

// Assessment Result Model
class Assessment {
  const Assessment({
    required this.id,
    required this.classification,
    required this.recommendation,
    required this.score,
    required this.responses,
    required this.createdAt,
  });

  final String id;
  final String classification;
  final String recommendation;
  final int score;
  final List<AssessmentResponse> responses;
  final DateTime createdAt;

  factory Assessment.fromJson(Map<String, dynamic> json) {
    final rawResponses = json['responses'] as List<dynamic>? ?? [];
    final responses = rawResponses
        .whereType<Map<String, dynamic>>()
        .map((r) => AssessmentResponse(
          questionId: r['questionId'] ?? '',
          question: r['question'] ?? '',
          score: r['score'] ?? 0,
        ))
        .toList();

    return Assessment(
      id: json['_id'] ?? json['id'] ?? '',
      classification: json['classification'] ?? 'medium',
      recommendation: json['recommendation'] ?? '',
      score: json['score'] ?? 0,
      responses: responses,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }
}

class ActivityService {
  ActivityService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  /// Fetch all available activities
  Future<List<Activity>> getActivities() async {
    final response = await _client.getJson(
      Uri.parse('$_defaultBaseUrl/api/patient/activities'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load activities');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    final activities = decoded['activities'] as List<dynamic>? ?? [];
    return activities
        .whereType<Map<String, dynamic>>()
        .map(Activity.fromJson)
        .toList();
  }
}

class AssessmentService {
  AssessmentService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  /// Submit assessment responses
  Future<Assessment> submitAssessment(List<AssessmentResponse> responses) async {
    final token = await _client.readToken();
    if (token == null || token.isEmpty) {
      throw Exception('Not authenticated');
    }

    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/patient/assessments'),
      body: {
        'responses': responses.map((r) => r.toJson()).toList(),
      },
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to submit assessment');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    final assessmentData = decoded['assessment'] as Map<String, dynamic>?;
    if (assessmentData == null) {
      throw Exception('No assessment in response');
    }

    return Assessment.fromJson(assessmentData);
  }

  /// Get latest assessment
  Future<Assessment?> getLatestAssessment() async {
    try {
      final response = await _client.getJson(
        Uri.parse('$_defaultBaseUrl/api/patient/assessments/latest'),
      );

      if (response.statusCode != 200) {
        return null;
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        return null;
      }

      final assessmentData = decoded['assessment'] as Map<String, dynamic>?;
      if (assessmentData == null) {
        return null;
      }

      return Assessment.fromJson(assessmentData);
    } catch (_) {
      return null;
    }
  }

  /// Get assessment by ID
  Future<Assessment> getAssessmentById(String id) async {
    final response = await _client.getJson(
      Uri.parse('$_defaultBaseUrl/api/patient/assessments/$id'),
    );

    if (response.statusCode != 200) {
      throw Exception('Assessment not found');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return Assessment.fromJson(decoded['assessment']);
  }
}
