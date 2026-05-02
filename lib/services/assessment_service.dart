import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class AssessmentQuestion {
  final String id;
  final String text;
  final String category; // Anxiety, Depression, Stress

  const AssessmentQuestion({
    required this.id,
    required this.text,
    required this.category,
  });

  factory AssessmentQuestion.fromJson(Map<String, dynamic> json) {
    return AssessmentQuestion(
      id: json['id']?.toString() ?? '',
      text: json['text']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Anxiety',
    );
  }
}

class AssessmentOption {
  final int value;
  final String label;

  const AssessmentOption({
    required this.value,
    required this.label,
  });
}

class AssessmentService {
  AssessmentService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  // Screening questions (9 questions) - matches web implementation
  final screeningQuestions = [
    // Anxiety (3)
    AssessmentQuestion(
      id: '1',
      text: 'I feel nervous, anxious, or on edge.',
      category: 'Anxiety',
    ),
    AssessmentQuestion(
      id: '2',
      text: 'I cannot stop or control worrying.',
      category: 'Anxiety',
    ),
    AssessmentQuestion(
      id: '3',
      text: 'I worry too much about different things.',
      category: 'Anxiety',
    ),
    // Depression (3)
    AssessmentQuestion(
      id: '5',
      text: 'I feel sad, empty, or hopeless.',
      category: 'Depression',
    ),
    AssessmentQuestion(
      id: '6',
      text: 'I have little interest or pleasure in doing things.',
      category: 'Depression',
    ),
    AssessmentQuestion(
      id: '7',
      text: 'I feel tired or have little energy.',
      category: 'Depression',
    ),
    // Stress (3)
    AssessmentQuestion(
      id: '9',
      text: 'I feel overwhelmed by responsibilities.',
      category: 'Stress',
    ),
    AssessmentQuestion(
      id: '10',
      text: 'I feel unable to control important things in my life.',
      category: 'Stress',
    ),
    AssessmentQuestion(
      id: '11',
      text: 'I feel irritated or easily angered.',
      category: 'Stress',
    ),
  ];

  final screeningOptions = [
    AssessmentOption(value: 0, label: 'Not at all'),
    AssessmentOption(value: 1, label: 'Several days'),
    AssessmentOption(value: 2, label: 'More than half the days'),
    AssessmentOption(value: 3, label: 'Nearly every day'),
  ];

  // Severity assessment questions - matches web implementation
  Map<String, List<AssessmentQuestion>> severityQuestions = {
    'Depression': [
      AssessmentQuestion(
        id: 'd1',
        text: 'Little interest or pleasure in doing things',
        category: 'Depression',
      ),
      AssessmentQuestion(
        id: 'd2',
        text: 'Feeling down, depressed, or hopeless',
        category: 'Depression',
      ),
      AssessmentQuestion(
        id: 'd3',
        text: 'Trouble falling or staying asleep, or sleeping too much',
        category: 'Depression',
      ),
      AssessmentQuestion(
        id: 'd4',
        text: 'Feeling tired or having little energy',
        category: 'Depression',
      ),
      AssessmentQuestion(
        id: 'd6',
        text:
            'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
        category: 'Depression',
      ),
      AssessmentQuestion(
        id: 'd9',
        text: 'Thoughts that you would be better off dead or of hurting yourself',
        category: 'Depression',
      ),
    ],
    'Anxiety': [
      AssessmentQuestion(
        id: 'a1',
        text: 'Feeling nervous, anxious, or on edge',
        category: 'Anxiety',
      ),
      AssessmentQuestion(
        id: 'a2',
        text: 'Not being able to stop or control worrying',
        category: 'Anxiety',
      ),
      AssessmentQuestion(
        id: 'a3',
        text: 'Worrying too much about different things',
        category: 'Anxiety',
      ),
      AssessmentQuestion(
        id: 'a4',
        text: 'Trouble relaxing',
        category: 'Anxiety',
      ),
      AssessmentQuestion(
        id: 'a5',
        text: 'Being so restless that it is hard to sit still',
        category: 'Anxiety',
      ),
      AssessmentQuestion(
        id: 'a7',
        text: 'Feeling afraid as if something awful might happen',
        category: 'Anxiety',
      ),
    ],
    'Stress': [
      AssessmentQuestion(
        id: 's1',
        text: 'Been upset because of something that happened unexpectedly',
        category: 'Stress',
      ),
      AssessmentQuestion(
        id: 's2',
        text: 'Felt unable to control important things in your life',
        category: 'Stress',
      ),
      AssessmentQuestion(
        id: 's3',
        text: 'Felt nervous and stressed',
        category: 'Stress',
      ),
      AssessmentQuestion(
        id: 's4',
        text: 'Felt confident about your ability to handle personal problems',
        category: 'Stress',
      ),
      AssessmentQuestion(
        id: 's6',
        text: 'Found that you could not cope with all the things you had to do',
        category: 'Stress',
      ),
      AssessmentQuestion(
        id: 's10',
        text: 'Felt difficulties were piling up so high that you could not overcome them',
        category: 'Stress',
      ),
    ],
  };

  final severityOptions = [
    AssessmentOption(value: 0, label: 'Not at all'),
    AssessmentOption(value: 1, label: 'Several days'),
    AssessmentOption(value: 2, label: 'More than half the days'),
    AssessmentOption(value: 3, label: 'Nearly every day'),
  ];

  final stressOptions = [
    AssessmentOption(value: 0, label: 'Never'),
    AssessmentOption(value: 1, label: 'Almost Never'),
    AssessmentOption(value: 2, label: 'Sometimes'),
    AssessmentOption(value: 3, label: 'Fairly Often'),
    AssessmentOption(value: 4, label: 'Very Often'),
  ];

  /// Calculate primary issue from screening answers
  /// Returns the category with the highest total score
  String calculatePrimaryIssue(List<int> screeningAnswers) {
    Map<String, int> scores = {'Anxiety': 0, 'Depression': 0, 'Stress': 0};

    for (int i = 0; i < screeningAnswers.length; i++) {
      scores[screeningQuestions[i].category] =
          scores[screeningQuestions[i].category]! + screeningAnswers[i];
    }

    String primaryIssue = 'Anxiety';
    int maxScore = -1;

    scores.forEach((category, score) {
      if (score > maxScore) {
        maxScore = score;
        primaryIssue = category;
      }
    });

    return primaryIssue;
  }

  /// Calculate severity assessment result with category-specific scoring
  Map<String, dynamic> calculateSeverityResult(
    String category,
    List<int> severityAnswers,
  ) {
    int total = 0;
    bool needsHelp = false;
    String level = '';
    String recommendation = '';

    if (category == 'Depression') {
      // Depression: 6 questions, 0-3 scale = 0-18 total
      total = severityAnswers.fold(0, (sum, score) => sum + score);

      if (total <= 4) {
        level = 'Minimal';
        recommendation =
            'Your responses suggest you may benefit from extra support. A guided conversation with MindBridge AI could help you reflect safely.';
      } else if (total <= 9) {
        level = 'Mild';
        recommendation =
            'Your responses suggest you may benefit from extra support. A guided conversation with MindBridge AI could help you reflect safely.';
      } else if (total <= 14) {
        level = 'Moderate';
        recommendation =
            'Your responses suggest you may benefit from extra support. A guided conversation with MindBridge AI could help you reflect safely.';
      } else if (total <= 19) {
        level = 'Moderately Severe';
        recommendation =
            'Your responses suggest you may need more direct human support. Please consider booking time with a qualified doctor or counselor.';
        needsHelp = true;
      } else {
        level = 'Severe';
        recommendation =
            'Your responses suggest you may need more direct human support. Please consider booking time with a qualified doctor or counselor.';
        needsHelp = true;
      }

      // Check last question (index 5) for suicidal ideation
      if (severityAnswers.isNotEmpty && severityAnswers.last > 0) {
        needsHelp = true;
        recommendation =
            'Your safety is our priority. Please contact a mental health professional immediately.';
      }
    } else if (category == 'Anxiety') {
      // Anxiety: 6 questions, 0-3 scale = 0-18 total
      total = severityAnswers.fold(0, (sum, score) => sum + score);

      if (total <= 4) {
        level = 'Minimal';
        recommendation =
            'Based on this screening, your current well-being appears relatively stable. Gentle activities and regular check-ins may be enough right now.';
      } else if (total <= 9) {
        level = 'Mild';
        recommendation =
            'Your responses suggest you may benefit from extra support. A guided conversation with MindBridge AI could help you reflect safely.';
      } else if (total <= 14) {
        level = 'Moderate';
        recommendation =
            'Your responses suggest you may benefit from extra support. A guided conversation with MindBridge AI could help you reflect safely.';
      } else {
        level = 'Severe';
        recommendation =
            'Your responses suggest you may need more direct human support. Please consider booking time with a qualified doctor or counselor.';
        needsHelp = true;
      }
    } else if (category == 'Stress') {
      // Stress: 6 questions, 0-4 scale, with reverse scoring
      // Reverse-scored items: index 3 (s4)
      total = 0;
      const List<int> reverseIndices = [3];

      for (int i = 0; i < severityAnswers.length; i++) {
        if (reverseIndices.contains(i)) {
          total += (4 - severityAnswers[i]);
        } else {
          total += severityAnswers[i];
        }
      }

      if (total <= 8) {
        level = 'Low';
        recommendation =
            'Based on this screening, your current well-being appears relatively stable. Gentle activities and regular check-ins may be enough right now.';
      } else if (total <= 16) {
        level = 'Moderate';
        recommendation =
            'Your responses suggest you may benefit from extra support. A guided conversation with MindBridge AI could help you reflect safely.';
      } else {
        level = 'High';
        recommendation =
            'Your responses suggest you may need more direct human support. Please consider booking time with a qualified doctor or counselor.';
        needsHelp = true;
      }
    }

    return {
      'total': total,
      'level': level,
      'needsHelp': needsHelp,
      'recommendation': recommendation,
    };
  }

  /// Submit assessment to backend
  Future<Map<String, dynamic>> submitAssessment({
    required List<int> screeningAnswers,
    required String primaryIssue,
    required List<int> severityAnswers,
  }) async {
    final token = await _client.readToken();
    if (token == null || token.isEmpty) {
      throw Exception('Not authenticated');
    }

    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/patient/assessments'),
      body: {
        'screeningAnswers': screeningAnswers,
        'primaryIssue': primaryIssue,
        'severityAnswers': severityAnswers,
      },
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to submit assessment: ${response.statusCode}');
    }

    if (response.body.isEmpty) {
      return {'success': true};
    }

    final decoded = jsonDecode(response.body);
    return decoded is Map<String, dynamic> ? decoded : {'success': true};
  }
}
