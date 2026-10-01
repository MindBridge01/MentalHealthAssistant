import 'package:flutter/material.dart';
import 'package:mindbridge_mobile/components/DashboardFeatureCard.dart';
import 'package:mindbridge_mobile/components/PatientDashboardCards.dart';
import 'package:mindbridge_mobile/components/PatientShell.dart';
import 'package:mindbridge_mobile/components/SummaryCard.dart';
import 'package:mindbridge_mobile/services/patient_service.dart';

class PatientDashboardPage extends StatefulWidget {
  const PatientDashboardPage({super.key});

  @override
  State<PatientDashboardPage> createState() => _PatientDashboardPageState();
}

class _PatientDashboardPageState extends State<PatientDashboardPage> {
  late Future<DashboardData> _dashboardDataFuture;
  final PatientService _patientService = PatientService();

  @override
  void initState() {
    super.initState();
    _dashboardDataFuture = _patientService.getDashboardData();
  }

  void _navigateTo(String route) {
    Navigator.of(context).pushNamed(route);
  }

  void _showSosDialog() {
    showDialog(
      context: context,
      builder: (context) => SosConfirmationDialog(
        onConfirm: _handleSos,
      ),
    );
  }

  Future<void> _handleSos() async {
    try {
      await _patientService.triggerSos();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Help is on the way. Your guardian has been notified.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PatientShell(
      currentTab: PatientNavTab.dashboard,
      child: Scaffold(
        appBar: AppBar(
          elevation: 0,
          backgroundColor: const Color(0xFFF9FAFB),
          foregroundColor: const Color(0xFF1F2937),
          title: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Patient Module',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.5,
                  color: Color(0xFF9CA3AF),
                ),
              ),
              SizedBox(height: 4),
              Text(
                'A calmer path, one step at a time',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: ElevatedButton.icon(
                onPressed: _showSosDialog,
                icon: const Icon(Icons.emergency, size: 18),
                label: const Text('SOS'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
        body: FutureBuilder<DashboardData>(
          future: _dashboardDataFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }

            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Error: ${snapshot.error}'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _dashboardDataFuture =
                              _patientService.getDashboardData();
                        });
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            final data = snapshot.data!;

            return RefreshIndicator(
              onRefresh: () async {
                setState(() {
                  _dashboardDataFuture = _patientService.getDashboardData();
                });
              },
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Summary Cards
                    GridView.count(
                      crossAxisCount:
                          MediaQuery.of(context).size.width < 600 ? 1 : 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      children: [
                        SummaryCard(
                          label: 'Available Activities',
                          value: '${data.activityCount}',
                          hint:
                              'Breathing, grounding, and reflection tools you can start in minutes.',
                        ),
                        SummaryCard(
                          label: 'Upcoming Appointments',
                          value: '${data.upcomingAppointments.length}',
                          hint: 'Your next doctor bookings show up here.',
                        ),
                        SummaryCard(
                          label: 'Doctors to Explore',
                          value: '${data.doctorCount}',
                          hint:
                              'Browse trusted professionals and book when you feel ready.',
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Feature Cards
                    const Text(
                      'Quick Access',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount:
                          MediaQuery.of(context).size.width < 600 ? 1 : 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 1.2,
                      children: [
                        DashboardFeatureCard(
                          title: 'AI Chat',
                          description:
                              'Reflect with supportive prompts and grounded responses.',
                          gradientColor: Colors.teal,
                          icon: Icons.forum,
                          onTap: () => _navigateTo('/ai-chat'),
                        ),
                        DashboardFeatureCard(
                          title: 'Take Assessment',
                          description: 'A short check-in to guide your next best step.',
                          gradientColor: Colors.cyan,
                          icon: Icons.psychology,
                          onTap: () => _navigateTo('/assessments'),
                        ),
                        DashboardFeatureCard(
                          title: 'Explore Activities',
                          description:
                              'Breathing, grounding, and gentle reflection tools.',
                          gradientColor: Colors.amber,
                          icon: Icons.self_improvement,
                          onTap: () => _navigateTo('/activities'),
                        ),
                        DashboardFeatureCard(
                          title: 'Find a Doctor',
                          description:
                              'Browse specialists and choose a time that feels right.',
                          gradientColor: Colors.indigo,
                          icon: Icons.local_hospital,
                          onTap: () => _navigateTo('/doctors'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Assessment and Appointments Section
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isMobile = constraints.maxWidth < 600;
                        return isMobile
                            ? Column(
                                children: [
                                  AssessmentCard(
                                    assessment: data.latestAssessment,
                                    onViewResult: () =>
                                        _navigateTo('/assessments'),
                                    onStartNew: () =>
                                        _navigateTo('/assessments'),
                                  ),
                                  const SizedBox(height: 16),
                                  _buildAppointmentsCard(data),
                                ],
                              )
                            : Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    flex: 11,
                                    child: AssessmentCard(
                                      assessment: data.latestAssessment,
                                      onViewResult: () =>
                                          _navigateTo('/assessments'),
                                      onStartNew: () =>
                                          _navigateTo('/assessments'),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    flex: 9,
                                    child: _buildAppointmentsCard(data),
                                  ),
                                ],
                              );
                      },
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildAppointmentsCard(DashboardData data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.85),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withOpacity(0.7),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Upcoming Appointments',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: Colors.grey[500],
            ),
          ),
          const SizedBox(height: 16),
          if (data.upcomingAppointments.isNotEmpty)
            Column(
              children: data.upcomingAppointments
                  .map(
                    (appointment) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: AppointmentItem(appointment: appointment),
                    ),
                  )
                  .toList(),
            )
          else
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(16),
              ),
              padding: const EdgeInsets.all(16),
              child: const Text(
                'No appointments booked yet. When you are ready, you can browse doctors and choose a time that fits.',
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B7280),
                  height: 1.6,
                ),
              ),
            ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () => _navigateTo('/appointments'),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(
                color: Color(0xFFD1D5DB),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 12,
              ),
            ),
            child: const Text(
              'View All Appointments',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SosConfirmationDialog extends StatefulWidget {
  const SosConfirmationDialog({
    super.key,
    required this.onConfirm,
  });

  final Future<void> Function() onConfirm;

  @override
  State<SosConfirmationDialog> createState() => _SosConfirmationDialogState();
}

class _SosConfirmationDialogState extends State<SosConfirmationDialog> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Are you sure you want to trigger SOS?'),
      content: const Text(
        'This sends an emergency alert to your saved guardian contact. If you are in immediate danger, please contact local emergency services too.',
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isLoading
              ? null
              : () async {
                  setState(() => _isLoading = true);
                  try {
                    await widget.onConfirm();
                    if (mounted) Navigator.pop(context);
                  } finally {
                    if (mounted) setState(() => _isLoading = false);
                  }
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
          ),
          child: _isLoading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Yes, send SOS'),
        ),
      ],
    );
  }
}
