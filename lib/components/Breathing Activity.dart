import 'package:flutter/material.dart';
import 'breathing_circle.dart';
import 'breathing_card.dart';

class BreathingActivitySection extends StatelessWidget {
  const BreathingActivitySection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        children: [
          const Text(
            "Take a Quick Breath Activity!",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 8),

          const Text(
            "A one-minute break to calm your heart. Let’s slow down together.",
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 30),

          Wrap(
            spacing: 30,        // horizontal space
            runSpacing: 30,     // vertical space
            alignment: WrapAlignment.center,
            children: [
              // 🔵 Circle with extra spacing
              const Padding(
                padding: EdgeInsets.all(8.0),
                child: BreathingCircleWidget(),
              ),

              // 🧠 Card with extra spacing
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: BreathingCardWidget(
                  title: "Relaxation",
                  description:
                      "I suggest a simple, calming exercise called the 4-4-4 technique (Box Breathing). "
                      "It helps you slow down, ease stress or anxiety, and bring your mind back to the present moment "
                      "when things feel overwhelming.\n\n"
                      "Here’s how it works: inhale deeply through your nose for 4 seconds, "
                      "hold your breath gently for 4 seconds, and exhale slowly for 4 seconds.",
                  imagePath: "assets/images/clock.png",
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}