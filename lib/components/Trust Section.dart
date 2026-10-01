import 'package:flutter/material.dart';
import 'trust_card.dart';

class TrustSection extends StatelessWidget {
  const TrustSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        children: [
          // 🔹 Header
          const Text(
            "You Can Trust Us",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 8),

          const Text(
            "We keep you safe and supported, always here for you.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
          ),

          const SizedBox(height: 30),

          // 🔹 Cards
          Column(
            children: const [
              TrustCardWidget(
                imagePath: "assets/TrustIcos/TrustIcon1.png",
                title: "Built on Unshaken Care",
                description:
                    "Every tool, every word is crafted to hold you gently—your peace is our foundation.",
              ),

              TrustCardWidget(
                imagePath: "assets/TrustIcos/TrustIcon2.png",
                title: "Guarded by Silent Strength",
                description:
                    "Your story stays safe with us, locked tight and handled with quiet respect.",
              ),

              TrustCardWidget(
                imagePath: "assets/TrustIcos/TrustIcon3.png",
                title: "Always Here for You",
                description:
                    "Day or night, our support is steady, ready to lift you when you need it most.",
              ),
            ],
          ),
        ],
      ),
    );
  }
}