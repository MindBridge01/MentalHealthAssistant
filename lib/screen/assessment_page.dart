import 'package:flutter/material.dart';
import 'package:mindbridge_mobile/services/assessment_service.dart';

class AssessmentPage extends StatefulWidget {
  const AssessmentPage({super.key});

  @override
  State<AssessmentPage> createState() => _AssessmentPageState();
}

class _AssessmentPageState extends State<AssessmentPage> with TickerProviderStateMixin {
  final AssessmentService _assessmentService = AssessmentService();

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // Assessment phases: screening, transition, severity, results
  String assessmentPhase = 'screening';
  int currentQuestionIndex = 0;

  // Data
  late List<int> screeningAnswers;
  late List<int> severityAnswers;
  late List<int> shuffledIndices;
  late String primaryIssue;
  late Map<String, dynamic> result;
  bool isSubmitting = false;

  @override
  void initState() {
    super.initState();
    screeningAnswers = [];
    severityAnswers = [];
    shuffledIndices = List.generate(_assessmentService.screeningQuestions.length, (i) => i);
    shuffledIndices.shuffle();
    primaryIssue = '';
    result = {};

    _fadeController = AnimationController(duration: const Duration(milliseconds: 500), vsync: this);
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(_fadeController);
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _nextQuestion() {
    _fadeController.reverse().then((_) {
      setState(() {
        currentQuestionIndex++;
      });
      _fadeController.forward();
    });
  }

  void _previousQuestion() {
    if (currentQuestionIndex > 0) {
      _fadeController.reverse().then((_) {
        setState(() {
          currentQuestionIndex--;
        });
        _fadeController.forward();
      });
    }
  }

  void _handleScreeningAnswer(int value) {
    screeningAnswers.add(value);

    if (screeningAnswers.length == _assessmentService.screeningQuestions.length) {
      primaryIssue = _assessmentService.calculatePrimaryIssue(screeningAnswers);
      _transitionToSeverity();
    } else {
      _nextQuestion();
    }
  }

  void _transitionToSeverity() {
    _fadeController.reverse().then((_) {
      setState(() {
        assessmentPhase = 'transition';
      });
      _fadeController.forward();
    });
  }

  void _continueToPart2() {
    _fadeController.reverse().then((_) {
      setState(() {
        assessmentPhase = 'severity';
        currentQuestionIndex = 0;
      });
      _fadeController.forward();
    });
  }

  void _handleSeverityAnswer(int value) {
    severityAnswers.add(value);

    final severityQuestions = _assessmentService.severityQuestions[primaryIssue] ?? [];
    if (severityAnswers.length == severityQuestions.length) {
      _calculateAndShowResult();
    } else {
      _nextQuestion();
    }
  }

  void _calculateAndShowResult() {
    final calcResult = _assessmentService.calculateSeverityResult(
      primaryIssue,
      severityAnswers,
    );

    _fadeController.reverse().then((_) {
      setState(() {
        result = calcResult;
        assessmentPhase = 'results';
      });
      _fadeController.forward();
    });
  }

  void _resetAssessment() {
    setState(() {
      assessmentPhase = 'screening';
      currentQuestionIndex = 0;
      screeningAnswers = [];
      severityAnswers = [];
      shuffledIndices.shuffle();
      primaryIssue = '';
      result = {};
      isSubmitting = false;
    });
    _fadeController.forward();
  }

  Future<void> _submitAndNavigate() async {
    setState(() => isSubmitting = true);

    try {
      await _assessmentService.submitAssessment(
        screeningAnswers: screeningAnswers,
        primaryIssue: primaryIssue,
        severityAnswers: severityAnswers,
      );

      if (mounted) {
        final level = result['level'] as String? ?? '';
        final needsHelp = result['needsHelp'] as bool? ?? false;

        // Navigate based on severity level (matches web implementation)
        if (needsHelp || ['Severe', 'Moderately Severe', 'High'].contains(level)) {
          Navigator.of(context).pushNamed('/doctors');
        } else if (['Moderate'].contains(level)) {
          Navigator.of(context).pushNamed('/ai-chat');
        } else {
          Navigator.of(context).pushNamed('/activities');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting assessment: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() => isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white,
                Colors.blue.withOpacity(0.05),
              ],
            ),
          ),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                children: [
                  if (assessmentPhase == 'screening')
                    _buildScreeningStep()
                  else if (assessmentPhase == 'transition')
                    _buildTransitionStep()
                  else if (assessmentPhase == 'severity')
                    _buildSeverityStep()
                  else if (assessmentPhase == 'results')
                    _buildResultStep(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildScreeningStep() {
    final questionIndex = shuffledIndices[currentQuestionIndex];
    final question = _assessmentService.screeningQuestions[questionIndex];
    final progress = (currentQuestionIndex + 1) / _assessmentService.screeningQuestions.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Assessment • Part 1 (${currentQuestionIndex + 1}/${_assessmentService.screeningQuestions.length})',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
            color: Colors.purple[600],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Over the last 2 weeks, how often have you experienced the following?',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
            height: 1.3,
          ),
        ),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[50],
            border: Border.all(color: Colors.grey[200]!),
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.all(20),
          child: Text(
            '"${question.text}"',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Color(0xFF374151),
              height: 1.4,
            ),
          ),
        ),
        const SizedBox(height: 24),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(Colors.purple[600]!),
          ),
        ),
        const SizedBox(height: 24),
        ..._assessmentService.screeningOptions.map(
          (option) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ElevatedButton(
              onPressed: () => _handleScreeningAnswer(option.value),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF1F2937),
                side: BorderSide(color: Colors.grey[300]!, width: 1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.purple[100],
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Center(
                      child: Text(
                        '${option.value}',
                        style: TextStyle(
                          color: Colors.purple[600],
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      option.label,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTransitionStep() {
    return Column(
      children: [
        const SizedBox(height: 40),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.blue[100],
            borderRadius: BorderRadius.circular(40),
          ),
          child: Icon(
            Icons.check_circle,
            size: 48,
            color: Colors.blue[600],
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Part 1 Complete',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Thank you for taking the time to answer the screening questions. Based on your responses, we have a few more specific follow-up questions to help us better understand what you are experiencing right now in Part 2.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[700],
            height: 1.6,
          ),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _continueToPart2,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue[600],
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
          ),
          child: const Text(
            'Continue to Part 2',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildSeverityStep() {
    final severityQuestions = _assessmentService.severityQuestions[primaryIssue] ?? [];
    final question = severityQuestions[currentQuestionIndex];
    final progress = (currentQuestionIndex + 1) / severityQuestions.length;

    // Use stress options for Stress category, else use regular options
    final options = primaryIssue == 'Stress'
        ? _assessmentService.stressOptions
        : _assessmentService.severityOptions;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Assessment • Part 2 (${currentQuestionIndex + 1}/${severityQuestions.length})',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
            color: Colors.blue[600],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          primaryIssue == 'Stress'
              ? 'In the last month, how often have you felt or thought the following?'
              : 'Over the last 2 weeks, how often have you been bothered by the following problems?',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
            height: 1.3,
          ),
        ),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            color: Colors.blue[50],
            border: Border.all(color: Colors.blue[200]!),
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.all(20),
          child: Text(
            '"${question.text}"',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Color(0xFF1E3A8A),
              height: 1.4,
            ),
          ),
        ),
        const SizedBox(height: 24),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
          ),
        ),
        const SizedBox(height: 24),
        ...options.map(
          (option) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ElevatedButton(
              onPressed: () => _handleSeverityAnswer(option.value),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF1F2937),
                side: BorderSide(color: Colors.grey[300]!, width: 1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.blue[100],
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Center(
                      child: Text(
                        '${option.value}',
                        style: TextStyle(
                          color: Colors.blue[600],
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      option.label,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            OutlinedButton(
              onPressed: currentQuestionIndex == 0 ? null : _previousQuestion,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFD1D5DB)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text(
                'Previous',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Question ${currentQuestionIndex + 1} of ${severityQuestions.length}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B7280),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildResultStep() {
    final needsHelp = result['needsHelp'] as bool? ?? false;
    final level = result['level'] as String? ?? '';
    final recommendation = result['recommendation'] as String? ?? '';

    final color = needsHelp || ['Severe', 'Moderately Severe', 'High'].contains(level)
        ? Colors.red
        : Colors.green;
    final icon = needsHelp || ['Severe', 'Moderately Severe', 'High'].contains(level)
        ? Icons.warning
        : Icons.health_and_safety;

    return Column(
      children: [
        const SizedBox(height: 24),
        Container(
          width: 96,
          height: 96,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color.withOpacity(0.3), color.withOpacity(0.1)],
            ),
            borderRadius: BorderRadius.circular(48),
          ),
          child: Icon(
            icon,
            size: 56,
            color: color,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Assessment Complete',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            border: Border.all(color: color.withOpacity(0.3)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Support Level: $level',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Primary Concern: $primaryIssue',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'What this means',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                recommendation,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _resetAssessment,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFD1D5DB)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Retake',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1F2937),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: isSubmitting ? null : _submitAndNavigate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: color,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        _getNextButtonLabel(level, needsHelp),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  String _getNextButtonLabel(String level, bool needsHelp) {
    if (needsHelp || ['Severe', 'Moderately Severe', 'High'].contains(level)) {
      return 'Find Doctor';
    } else if (['Moderate'].contains(level)) {
      return 'Chat with AI';
    } else {
      return 'Try Activities';
    }
  }
}
