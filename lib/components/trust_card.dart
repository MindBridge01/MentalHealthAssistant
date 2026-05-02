import 'package:flutter/material.dart';

class TrustCardWidget extends StatelessWidget {
  final String imagePath;
  final String title;
  final String description;

  const TrustCardWidget({
    super.key,
    required this.imagePath,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.shade300,
            width: 1,
          ),
        ),
      ),
      child: Row(
        
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // 🖼️ Icon Image
          Image.asset(
            imagePath,
            width: 80,
            height: 80,
          ),

          const SizedBox(width: 16),

          // 🧠 Text Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: const Color.fromARGB(255, 32, 29, 29),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}