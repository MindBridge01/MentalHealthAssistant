import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../components/Hero Section.dart';
import '../components/Quick Options.dart';
import '../components/Breathing Activity.dart';
import '../components/Trust Section.dart';
import '../components/Motivate Section.dart';
import '../components/Footer.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    _checkIfLoggedIn();
  }

  Future<void> _checkIfLoggedIn() async {
    await Future.delayed(const Duration(milliseconds: 100));
    
    if (!mounted) return;

    final prefs = await SharedPreferences.getInstance();
    final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

    // If user is logged in, navigate to dashboard
    // (This handles refresh/back button scenarios)
    if (isLoggedIn) {
      Navigator.of(context).pushReplacementNamed('/patient-dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: 'Profile',
            onPressed: () => Navigator.of(context).pushNamed('/profile-settings'),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          children: [
            HeroSection(),
            SizedBox(height: 40),
            QuickOptionsSection(),
            SizedBox(height: 40),
            BreathingActivitySection(),
            SizedBox(height: 40),
            TrustSection(),
            SizedBox(height: 40),
            MotivateSection(),
            SizedBox(height: 40),
            FooterSection(),
          ],
        ),
      ),
    );
  }
}