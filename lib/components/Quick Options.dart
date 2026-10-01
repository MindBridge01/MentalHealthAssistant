import 'package:flutter/material.dart';

class QuickOptionsSection extends StatelessWidget {
  const QuickOptionsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          const Text(
            "Ways to Feel Better",
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "Find help that fits you safe, simple, and here for you",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 20),

          Wrap(
            spacing: 16,
            runSpacing: 16,
            alignment: WrapAlignment.center,
            children: [
              _card(
                context,
                image: "assets/images/doctor.png",
                title: "Talk to a Doctor",
                description:
                    "Connect with a licensed professional for a private consultation—available through video or voice, booked right from the platform.",
                buttonText: "Meet Doctor",
                onTap: () {},
              ),

              _card(
                context,
                image: "assets/images/community.png",
                title: "Join Our Community",
                description:
                    "Share your thoughts or find strength in others’ stories—an anonymous, moderated space to connect on the Community page.",
                buttonText: "Join Community",
                onTap: () {},
              ),

              _card(
                context,
                image: "assets/images/emergency.png",
                title: "Call Help Now",
                description: "Immediate support, 24/7—reach out anytime.",
                buttonText: "Get a Call",
                onTap: () {},
                isEmergency: true,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _card(
    BuildContext context, {
    required String image,
    required String title,
    required String description,
    required String buttonText,
    required VoidCallback onTap,
    bool isEmergency = false,
  }) {
    return Container(
      width: 260,
      height: 360, // ✅ fixed equal height for ALL cards
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: isEmergency
            ? Border.all(color: Colors.red.shade300, width: 2)
            : null,
        boxShadow: const [
          BoxShadow(
            blurRadius: 10,
            color: Color.fromARGB(31, 10, 10, 10),
            offset: Offset(0, 5),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 📸 Image
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                image,
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),

            const SizedBox(height: 12),

            // 🧠 Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 8),

            // 📄 Description
            Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14),
            ),

            const Spacer(), // ⭐ pushes button to SAME bottom position

            // 🔘 Button(s) (fixed bottom alignment)
            SizedBox(
              width: double.infinity,
              height: 45,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      isEmergency ? const Color.fromARGB(255, 16, 16, 28) : const Color.fromARGB(255, 16, 16, 28),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: onTap,
                child: Text(
                  buttonText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}