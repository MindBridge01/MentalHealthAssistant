import 'package:flutter/material.dart';
import 'package:mindbridge_mobile/screen/home.dart';

enum PatientNavTab {
  dashboard,
  chat,
  assessments,
  activities,
  community,
  doctors,
  appointments,
}

class PatientShell extends StatefulWidget {
  const PatientShell({
    super.key,
    required this.currentTab,
    required this.child,
    this.onTabChanged,
  });

  final PatientNavTab currentTab;
  final Widget child;
  final Function(PatientNavTab)? onTabChanged;

  @override
  State<PatientShell> createState() => _PatientShellState();
}

class _PatientShellState extends State<PatientShell> {
  late PatientNavTab _currentTab;

  @override
  void initState() {
    super.initState();
    _currentTab = widget.currentTab;
  }

  void _navigateTo(PatientNavTab tab, String route) {
    if (_currentTab != tab) {
      setState(() {
        _currentTab = tab;
      });
      widget.onTabChanged?.call(tab);
      Navigator.of(context).pushReplacementNamed(route);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 768;

    return Scaffold(
      body: isMobile
          ? widget.child
          : Row(
              children: [
                // Sidebar for tablet/desktop
                NavigationRail(
                  selectedIndex: _currentTab.index,
                  labelType: NavigationRailLabelType.all,
                  destinations: const [
                    NavigationRailDestination(
                      icon: Icon(Icons.dashboard),
                      label: Text('Dashboard'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.forum),
                      label: Text('AI Chat'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.psychology),
                      label: Text('Assessments'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.self_improvement),
                      label: Text('Activities'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.group),
                      label: Text('Community'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.local_hospital),
                      label: Text('Doctors'),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.event),
                      label: Text('Appointments'),
                    ),
                  ],
                  onDestinationSelected: (index) {
                    final tab = PatientNavTab.values[index];
                    final routes = [
                      '/patient-dashboard',
                      '/ai-chat',
                      '/assessments',
                      '/activities',
                      '/community',
                      '/doctors',
                      '/appointments',
                    ];
                    _navigateTo(tab, routes[index]);
                  },
                ),
                // Main content
                Expanded(child: widget.child),
              ],
            ),
      // Bottom navigation for mobile
      bottomNavigationBar: isMobile
          ? BottomNavigationBar(
              currentIndex: _currentTab.index,
              type: BottomNavigationBarType.shifting,
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard),
                  label: 'Dashboard',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.forum),
                  label: 'Chat',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.psychology),
                  label: 'Assess',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.self_improvement),
                  label: 'Activity',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.group),
                  label: 'Community',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.local_hospital),
                  label: 'Doctors',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.event),
                  label: 'Book',
                ),
              ],
              onTap: (index) {
                final tab = PatientNavTab.values[index];
                final routes = [
                  '/patient-dashboard',
                  '/ai-chat',
                  '/assessments',
                  '/activities',
                  '/community',
                  '/doctors',
                  '/appointments',
                ];
                _navigateTo(tab, routes[index]);
              },
            )
          : null,
    );
  }
}
