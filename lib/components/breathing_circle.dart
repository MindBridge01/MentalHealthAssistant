import 'dart:async';
import 'package:flutter/material.dart';

class BreathingCircleWidget extends StatefulWidget {
  const BreathingCircleWidget({super.key});

  @override
  State<BreathingCircleWidget> createState() => _BreathingCircleWidgetState();
}

class _BreathingCircleWidgetState extends State<BreathingCircleWidget> {
  double progress = 0;
  bool isPlaying = false;
  Timer? timer;

  void startBreathing() {
    setState(() {
      isPlaying = true;
      progress = 0;
    });

    timer = Timer.periodic(const Duration(milliseconds: 50), (t) {
      setState(() {
        progress += 0.8;

        if (progress >= 100) {
          progress = 100;
          isPlaying = false;
          t.cancel();
        }
      });
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: startBreathing,
          child: SizedBox(
            width: 220,
            height: 220,
            child: Stack(
              alignment: Alignment.center,
              children: [

                // 🔘 BACKGROUND RING (thick light grey)
                SizedBox(
                  width: 220,
                  height: 220,
                  child: CircularProgressIndicator(
                    value: 1.0,
                    strokeWidth: 18, // 👈 THICK RING
                    valueColor: AlwaysStoppedAnimation(
                      Colors.grey.shade300,
                    ),
                  ),
                ),

                // 🔵 PROGRESS RING (same thickness + soft blue like video)
                SizedBox(
                  width: 220,
                  height: 220,
                  child: CircularProgressIndicator(
                    value: progress / 100,
                    strokeWidth: 18, // 👈 SAME THICKNESS
                    valueColor: const AlwaysStoppedAnimation(
                      Color.fromARGB(255, 95, 46, 94), // soft sky-blue (video-like glow)
                    ),
                    backgroundColor: Colors.transparent,
                  ),
                ),

                // ▶ PLAY BUTTON
                if (!isPlaying)
                  const Icon(
                    Icons.play_arrow,
                    size: 45,
                    color: Colors.black,
                  ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        Text(
          "${progress.toInt()}%",
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}