import 'package:flutter/material.dart';

class FooterSection extends StatefulWidget {
  const FooterSection({super.key});

  @override
  State<FooterSection> createState() => _FooterSectionState();
}

class _FooterSectionState extends State<FooterSection> {
  final TextEditingController _emailController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _handleSubscribe() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter an email.')));
      return;
    }

    setState(() => _submitting = true);
    await Future.delayed(const Duration(milliseconds: 600));
    setState(() => _submitting = false);

    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Subscribed — thank you.')));
    _emailController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/Shape.png',
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 140, 16, 24),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1200),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0B2D4D),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [
                          BoxShadow(color: Color(0x20000000), blurRadius: 12, offset: Offset(0, 6)),
                        ],
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'Subscribe Newsletters',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white),
                          ),
                          const SizedBox(height: 20),
                          LayoutBuilder(builder: (context, constraints) {
                            final isWide = constraints.maxWidth >= 520;

                            final emailField = TextField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: InputDecoration(
                                hintText: 'Enter your email',
                                filled: true,
                                fillColor: Colors.white,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                              ),
                            );

                            final subscribeButton = SizedBox(
                              height: 48,
                              child: ElevatedButton(
                                onPressed: _submitting ? null : _handleSubscribe,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFD8F1FF),
                                  foregroundColor: const Color(0xFF0B2D4D),
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: Text(_submitting ? 'Subscribing...' : 'Subscribe Now'),
                              ),
                            );

                            if (isWide) {
                              return Row(children: [Expanded(child: emailField), const SizedBox(width: 16), subscribeButton]);
                            }

                            return Column(children: [emailField, const SizedBox(height: 12), SizedBox(width: double.infinity, child: subscribeButton)]);
                          }),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                    LayoutBuilder(builder: (context, constraints) {
                      final isWide = constraints.maxWidth >= 720;

                      final links = Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 24,
                        runSpacing: 12,
                        children: const [
                          Text('About us', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1F1F1F))),
                          Text('Discover', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1F1F1F))),
                          Text('Explore', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1F1F1F))),
                          Text('Books', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1F1F1F))),
                        ],
                      );

                      final socials = Row(mainAxisSize: MainAxisSize.min, children: const [
                        _SocialIcon(assetPath: 'assets/images/facebook-black.png', size: 24),
                        SizedBox(width: 14),
                        _SocialIcon(assetPath: 'assets/images/twitter-black.png', size: 22),
                        SizedBox(width: 14),
                        _SocialIcon(assetPath: 'assets/images/vimeo-black.png', size: 22),
                        SizedBox(width: 14),
                        _SocialIcon(assetPath: 'assets/images/youtube-black.png', size: 22),
                      ]);

                      final bottomRow = Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.center, children: [
                        const Text('© 2025 Mind Bridge. All rights reserved.', style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                        Image.asset('assets/logo/logolight.png', width: 100, fit: BoxFit.contain),
                        const Text('Terms of Service   Privacy Policy', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1F1F1F))),
                      ]);

                      if (isWide) {
                        return Column(children: [Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.center, children: [links, socials]), const SizedBox(height: 28), Container(height: 1, width: double.infinity, color: const Color(0xFFD1D5DB)), const SizedBox(height: 20), bottomRow]);
                      }

                      return Column(children: [links, const SizedBox(height: 20), socials, const SizedBox(height: 24), Container(height: 1, width: double.infinity, color: const Color(0xFFD1D5DB)), const SizedBox(height: 18), Column(children: [const Text('© 2025 Mind Bridge. All rights reserved.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))), const SizedBox(height: 14), Image.asset('assets/logo/logolight.png', width: 100, fit: BoxFit.contain), const SizedBox(height: 14), const Text('Terms of Service   Privacy Policy', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF1F1F1F))),])]);
                    }),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SocialIcon extends StatelessWidget {
  const _SocialIcon({required this.assetPath, required this.size});

  final String assetPath;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Image.asset(assetPath, width: size, height: size, fit: BoxFit.contain);
  }
}

