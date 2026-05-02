import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';

class MotivateSection extends StatefulWidget {
  const MotivateSection({super.key});

  @override
  State<MotivateSection> createState() => _MotivateSectionState();
}

class _MotivateSectionState extends State<MotivateSection> {
  late final Timer _timer;
  int _currentIndex = 0;

  final List<_Testimonial> _testimonials = const [
    _Testimonial(
      profileImage: 'assets/persons/Dp1.png',
      backgroundImage: 'assets/persons/fadeimage1.png',
      quote:
          'The life you have left is a gift. Cherish it. Enjoy it now, to the fullest. Do what matters, now.',
      author: 'Leo Babauta',
    ),
    _Testimonial(
      profileImage: 'assets/persons/Dp2.png',
      backgroundImage: 'assets/persons/fadeimage2.png',
      quote:
          'Life is not measured by the number of breaths we take, but by the moments that take our breath away.',
      author: 'Maya Angelou',
    ),
    _Testimonial(
      profileImage: 'assets/persons/Dp3.png',
      backgroundImage: 'assets/persons/fadeimage3.png',
      quote:
          'In the end, it is not the years in your life that count. It is the life in your years.',
      author: 'Abraham Lincoln',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted) return;
      setState(() {
        _currentIndex = (_currentIndex + 1) % _testimonials.length;
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final testimonial = _testimonials[_currentIndex];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            'Take a Quick Breath Activity!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0B2D4D),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'A one-minute break to calm your heart. So lets try fast enough to fit anywhere.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              height: 1.5,
              color: Color(0xFF0B2D4D),
            ),
          ),
          const SizedBox(height: 24),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 600),
            child: _MotivateCard(
              key: ValueKey<int>(_currentIndex),
              testimonial: testimonial,
            ),
          ),
        ],
      ),
    );
  }
}

class _MotivateCard extends StatelessWidget {
  const _MotivateCard({super.key, required this.testimonial});

  final _Testimonial testimonial;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 900),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF22D3EE), Color(0xFFF472B6), Color(0xFF8B5CF6)],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(2),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: Container(
            color: Colors.white,
            child: Stack(
              children: [
                Positioned(
                  top: 0,
                  right: 0,
                  child: Image.asset(
                    testimonial.backgroundImage,
                    width: 180,
                    fit: BoxFit.contain,
                    opacity: const AlwaysStoppedAnimation(0.75),
                  ),
                ),
                Positioned(
                  top: 0,
                  right: 18,
                  child: Image.asset(
                    'assets/Elipses/Ellipse7.png',
                    width: 120,
                    fit: BoxFit.contain,
                    opacity: const AlwaysStoppedAnimation(0.3),
                  ),
                ),
                Positioned(
                  top: 26,
                  right: 32,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(60),
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFF67E8F9),
                          Color(0xFF818CF8),
                          Color(0xFFF472B6),
                        ],
                      ),
                    ),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 35, sigmaY: 35),
                      child: const SizedBox.expand(),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(18),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final isSmall = constraints.maxWidth < 600;

                      if (isSmall) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 40,
                              backgroundImage: AssetImage(
                                testimonial.profileImage,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              '“',
                              style: TextStyle(
                                fontSize: 42,
                                height: 1,
                                color: Color(0xFF0B2D4D),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              testimonial.quote,
                              style: const TextStyle(
                                fontSize: 16,
                                height: 1.5,
                                color: Color(0xFF0B2D4D),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              '- ${testimonial.author}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF555555),
                              ),
                            ),
                          ],
                        );
                      }

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 56,
                            backgroundImage: AssetImage(
                              testimonial.profileImage,
                            ),
                          ),
                          const SizedBox(width: 22),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '“',
                                  style: TextStyle(
                                    fontSize: 56,
                                    height: 1,
                                    color: Color(0xFF0B2D4D),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  testimonial.quote,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    height: 1.5,
                                    color: Color(0xFF0B2D4D),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '- ${testimonial.author}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    color: Color(0xFF555555),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Testimonial {
  const _Testimonial({
    required this.profileImage,
    required this.backgroundImage,
    required this.quote,
    required this.author,
  });

  final String profileImage;
  final String backgroundImage;
  final String quote;
  final String author;
}
