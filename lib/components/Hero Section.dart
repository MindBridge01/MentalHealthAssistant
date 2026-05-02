 import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:video_player/video_player.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../services/chat_service.dart';

class HeroSection extends StatefulWidget {
  const HeroSection({super.key});

  @override
  State<HeroSection> createState() => _HeroSectionState();
}

class _HeroSectionState extends State<HeroSection> {
  late final VideoPlayerController _controller;

  @override
  void initState() {
    super.initState();

    _controller = VideoPlayerController.asset('assets/videos/heroVideo.mp4')
      ..setLooping(true)
      ..setVolume(0);

    _controller
        .initialize()
        .then((_) {
          if (!mounted) return;
          setState(() {});
          _controller.play();
        })
        .catchError((error) {
          debugPrint('Video error: $error');
        });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 900;

          return SizedBox(
            height: isWide ? 880 : 760,
            child: Stack(
              children: [
                Positioned.fill(
                  child: _controller.value.isInitialized
                      ? FittedBox(
                          fit: BoxFit.cover,
                          child: SizedBox(
                            width: _controller.value.size.width,
                            height: _controller.value.size.height,
                            child: VideoPlayer(_controller),
                          ),
                        )
                      : Container(color: Colors.black),
                ),
                Positioned.fill(
                  child: Container(
                    color: const Color(0xFF1A1714).withOpacity(0.56),
                  ),
                ),
                Positioned.fill(
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color(0x604A493B),
                          Color(0x3D221F1B),
                          Color(0x94000000),
                        ],
                      ),
                    ),
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isWide ? 24 : 16,
                      vertical: 0,
                    ),
                    child: Column(
                      children: [
                        _HeroNavbar(isWide: isWide),
                        Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                              top: isWide ? 24 : 20,
                              bottom: isWide ? 16 : 12,
                            ),
                            child: isWide
                                ? Row(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Expanded(
                                        child: Padding(
                                          padding: const EdgeInsets.only(
                                            right: 40,
                                            bottom: 20,
                                          ),
                                          child: _HeroHeadline(),
                                        ),
                                      ),
                                      const SizedBox(width: 20),
                                      const SizedBox(
                                        width: 500,
                                        child: Align(
                                          alignment: Alignment.bottomRight,
                                          child: HeroChatCard(),
                                        ),
                                      ),
                                    ],
                                  )
                                : SingleChildScrollView(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: const [
                                        SizedBox(height: 40),
                                        _HeroHeadline(),
                                        SizedBox(height: 24),
                                        HeroChatCard(),
                                        SizedBox(height: 20),
                                      ],
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _quickButton(String text, VoidCallback onPressed) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF2E2F6B),
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      ),
      onPressed: onPressed,
      child: Text(text),
    );
  }
}

class _HeroNavbar extends StatefulWidget {
  const _HeroNavbar({required this.isWide});

  final bool isWide;

  @override
  State<_HeroNavbar> createState() => _HeroNavbarState();
}

class _HeroNavbarState extends State<_HeroNavbar> {
  String? _profilePicUrl;
  bool _isLoggedIn = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadProfilePic();
    // Periodically check for profile pic updates (every 1 second)
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _loadProfilePic(),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadProfilePic() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final url = prefs.getString('profilePicUrl');
      final loggedIn = prefs.getBool('isLoggedIn') ?? false;
      if (mounted && url != _profilePicUrl) {
        setState(() => _profilePicUrl = url);
      }
      if (mounted && loggedIn != _isLoggedIn) {
        setState(() => _isLoggedIn = loggedIn);
      }
    } catch (_) {}
  }

  Future<void> _handleAuthTap() async {
    if (_isLoggedIn) {
      const storage = FlutterSecureStorage();
      final prefs = await SharedPreferences.getInstance();
      await storage.delete(key: 'auth_token');
      await prefs.remove('profilePicUrl');
      await prefs.setBool('isLoggedIn', false);
      if (!mounted) return;
      setState(() {
        _isLoggedIn = false;
        _profilePicUrl = null;
      });
      Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
      return;
    }

    Navigator.of(context).pushNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    final navItems = ['Home', 'AI Chat', 'Community', 'About'];

    return Container(
      constraints: const BoxConstraints(minHeight: 101),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: Color(0x40FFFFFF)),
          bottom: BorderSide(color: Color(0x40FFFFFF)),
        ),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final useDesktopLayout = widget.isWide && constraints.maxWidth >= 1280;

          return Padding(
            padding: EdgeInsets.symmetric(vertical: useDesktopLayout ? 0 : 16),
            child: useDesktopLayout
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 150,
                        child: SvgPicture.asset(
                          'assets/images/hero-logo.svg',
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(width: 32),
                      Expanded(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            ...navItems.map(
                              (item) => Padding(
                                padding: const EdgeInsets.only(left: 24),
                                child: GestureDetector(
                                  onTap: item == 'AI Chat'
                                      ? () => Navigator.of(context).pushNamed('/ai-chat')
                                      : null,
                                  child: Text(
                                    item,
                                    style: TextStyle(
                                      color: item == 'AI Chat'
                                          ? Colors.white
                                          : Colors.white,
                                      fontSize: 14,
                                      fontWeight: item == 'AI Chat'
                                          ? FontWeight.w600
                                          : FontWeight.w300,
                                      letterSpacing: 0.4,
                                      decoration: item == 'AI Chat'
                                          ? TextDecoration.underline
                                          : TextDecoration.none,
                                      decorationColor: Colors.white70,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 24),
                            _HeroActionButton(
                              label: _isLoggedIn ? 'Logout' : 'Log In',
                              backgroundColor: const Color(0xFF2E2F6B),
                              foregroundColor: Colors.white,
                              onPressed: _handleAuthTap,
                            ),
                            const SizedBox(width: 12),
                            _HeroActionButton(
                              label: 'Immediate Support',
                              backgroundColor: const Color(0xFFFDD5D3),
                              foregroundColor: const Color(0xFFF72B25),
                              icon: Icons.warning_amber_rounded,
                            ),                            const SizedBox(width: 12),
                            GestureDetector(
                              onTap: () {
                                WidgetsBinding.instance.addPostFrameCallback((_) {
                                  Navigator.of(context).pushNamed('/profile-settings');
                                });
                              },
                              child: CircleAvatar(
                                backgroundColor: Colors.white,
                                radius: 18,
                                backgroundImage: _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                                    ? NetworkImage(_profilePicUrl!)
                                    : null,
                                child: _profilePicUrl == null || _profilePicUrl!.isEmpty
                                    ? const Icon(
                                        Icons.person,
                                        color: Colors.black87,
                                        size: 20,
                                      )
                                    : null,
                              ),
                            ),                          ],
                        ),
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          SizedBox(
                            width: 125,
                            child: SvgPicture.asset(
                              'assets/images/hero-logo.svg',
                              fit: BoxFit.contain,
                            ),
                          ),
                          const Spacer(),
                          _HeroActionButton(
                            label: _isLoggedIn ? 'Logout' : 'Log In',
                            backgroundColor: const Color(0xFF2E2F6B),
                            foregroundColor: Colors.white,
                            compact: true,
                            onPressed: _handleAuthTap,
                          ),
                          const SizedBox(width: 8),
                          _HeroActionButton(
                            label: 'Immediate Support',
                            backgroundColor: const Color(0xFFFDD5D3),
                            foregroundColor: const Color(0xFFF72B25),
                            icon: Icons.warning_amber_rounded,
                            compact: true,
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () {
                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                Navigator.of(context).pushNamed('/profile-settings');
                              });
                            },
                            child: CircleAvatar(
                              radius: 16,
                              backgroundColor: Colors.white,
                              backgroundImage: _profilePicUrl != null && _profilePicUrl!.isNotEmpty
                                  ? NetworkImage(_profilePicUrl!)
                                  : null,
                              child: _profilePicUrl == null || _profilePicUrl!.isEmpty
                                  ? const Icon(Icons.person, color: Colors.black87, size: 18)
                                  : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 18,
                        runSpacing: 10,
                        children: navItems
                            .map(
                              (item) => GestureDetector(
                                onTap: item == 'AI Chat'
                                    ? () => Navigator.of(context).pushNamed('/ai-chat')
                                    : null,
                                child: Text(
                                  item,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: item == 'AI Chat'
                                        ? FontWeight.w600
                                        : FontWeight.w300,
                                    decoration: item == 'AI Chat'
                                        ? TextDecoration.underline
                                        : TextDecoration.none,
                                    decorationColor: Colors.white70,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                  ),
          );
        },
      ),
    );
  }
}

class _HeroActionButton extends StatelessWidget {
  const _HeroActionButton({
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
    this.onPressed,
    this.icon,
    this.compact = false,
  });

  final String label;
  final Color backgroundColor;
  final Color foregroundColor;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(4),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(4),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: compact ? 12 : 20),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, color: foregroundColor, size: compact ? 18 : 20),
                const SizedBox(width: 8),
              ],
              Padding(
                padding: EdgeInsets.symmetric(vertical: compact ? 8 : 10),
                child: Text(
                  label,
                  style: TextStyle(
                    color: foregroundColor,
                    fontSize: compact ? 12 : 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroHeadline extends StatelessWidget {
  const _HeroHeadline();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'You are not alone',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            height: 1.2,
            letterSpacing: -0.3,
          ),
        ),
        SizedBox(height: 12),
        Text(
          'Support that feels true to you',
          style: TextStyle(
            color: Colors.white,
            fontSize: 56,
            fontWeight: FontWeight.w200,
            height: 1.05,
            letterSpacing: -1.5,
          ),
        ),
      ],
    );
  }
}

class HeroChatCard extends StatefulWidget {
  const HeroChatCard({super.key});

  @override
  State<HeroChatCard> createState() => _HeroChatCardState();
}

class _HeroChatCardState extends State<HeroChatCard> {
  bool _isOpen = false;
  bool _isSending = false;
  bool _isCrisis = false;
  String? _error;
  final List<_ChatMessage> _messages = [];
  final TextEditingController _controller = TextEditingController();
  final ChatService _chatService = ChatService();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _sendMessage([String? overrideText]) async {
    if (_isSending) return;

    final text = (overrideText ?? _controller.text).trim();
    if (text.isEmpty) return;

    final history = [
      ..._messages,
      _ChatMessage(role: 'user', content: text),
    ]
        .where((message) => message.role != 'thinking')
        .map((message) => ChatMessagePayload(role: message.role, content: message.content))
        .toList();

    setState(() {
      _messages.add(_ChatMessage(role: 'user', content: text));
      _messages.add(
        const _ChatMessage(role: 'thinking', content: 'Thinking...'),
      );
      _controller.clear();
      _isOpen = true;
      _isSending = true;
      _error = null;
      _isCrisis = false;
    });

    try {
      final reply = await _chatService.sendMessage(
        message: text,
        messages: history,
      );

      if (!mounted) return;
      setState(() {
        _messages.removeWhere((message) => message.role == 'thinking');
        _messages.add(
          _ChatMessage(
            role: 'assistant',
            content: reply.content,
            sources: reply.sources,
          ),
        );
        _isCrisis = reply.safety?['event'] == 'crisis_detected';
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _messages.removeWhere((message) => message.role == 'thinking');
        _messages.add(
          const _ChatMessage(
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
          ),
        );
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hiddenVideo = !_isOpen && _messages.isEmpty;
    final screenWidth = MediaQuery.of(context).size.width;
    final isWide = screenWidth >= 900;
    
    // Responsive heights: on mobile, use smaller card
    final closedHeight = isWide ? 500.0 : 320.0;
    final openHeight = isWide ? 760.0 : 600.0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
      constraints: const BoxConstraints(maxWidth: 500),
      height: _isOpen ? openHeight : closedHeight,
      decoration: BoxDecoration(
        color: const Color(0xFFF2F6FC),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x48000000),
            blurRadius: 56,
            offset: Offset(0, 24),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          if (hiddenVideo)
            Positioned.fill(
              top: 50,
              child: VideoPlayerCard(
                videoAssetPath: 'assets/videos/heroVideo.mp4',
                overlayColor: Colors.transparent,
              ),
            ),
          if (hiddenVideo)
            const Positioned.fill(
              bottom: 0,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x00FFFFFF), Color(0xFFFFFFFF)],
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Spacer(),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          _isOpen = !_isOpen;
                        });
                      },
                      icon: Icon(
                        _isOpen ? Icons.close : Icons.star_rounded,
                        color: _isOpen
                            ? const Color(0xFF2D2E3D)
                            : const Color(0xFF2E2F6B),
                      ),
                    ),
                  ],
                ),
                if (_isCrisis)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF1F2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFECDD3)),
                      ),
                      child: const Text(
                        'A higher-risk message was detected. Prioritize immediate human support or SOS.',
                        style: TextStyle(
                          color: Color(0xFF9F1239),
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFED7AA)),
                      ),
                      child: Text(
                        _error!,
                        style: const TextStyle(
                          color: Color(0xFF9A3412),
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: ListView(
                      children: [
                        if (_messages.isEmpty)
                          const Padding(
                            padding: EdgeInsets.only(top: 250),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                SizedBox(height: 8),
                                Text(
                                  'Hey there! We\'re so glad you\'re here. Let\'s jump into our chat and share some fun ?',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w300,
                                    height: 1.45,
                                    color: Color(0xFF2D2E3D),
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Column(
                              children: _messages
                                  .expand(
                                    (message) => [
                                      Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 10,
                                        ),
                                        child: Align(
                                          alignment: message.role == 'user'
                                              ? Alignment.centerRight
                                              : Alignment.centerLeft,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 14,
                                              vertical: 10,
                                            ),
                                            decoration: BoxDecoration(
                                              color: message.role == 'user'
                                                  ? const Color(0xFF2E2F6B)
                                                  : const Color(0xFFE9EEF7),
                                              borderRadius: BorderRadius.circular(
                                                18,
                                              ),
                                            ),
                                            child: Text(
                                              message.content,
                                              style: TextStyle(
                                                color: message.role == 'user'
                                                    ? Colors.white
                                                    : const Color(0xFF2D2E3D),
                                                fontSize: 14,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      if (message.role == 'assistant' &&
                                          message.sources.isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(
                                            left: 4,
                                            right: 4,
                                            bottom: 10,
                                          ),
                                          child: Wrap(
                                            spacing: 8,
                                            runSpacing: 8,
                                            children: message.sources
                                                .map(
                                                  (source) => Chip(
                                                    label: Text(
                                                      source.title,
                                                      style: const TextStyle(
                                                        fontSize: 11,
                                                      ),
                                                    ),
                                                    backgroundColor: Colors.white,
                                                    side: BorderSide.none,
                                                    visualDensity:
                                                        VisualDensity.compact,
                                                  ),
                                                )
                                                .toList(),
                                          ),
                                        ),
                                    ],
                                  )
                                  .toList(),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                if (_messages.isEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(4, 0, 4, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: [
                            _HeroQuickReplyButton(
                              text: 'Where should I start?',
                              onPressed: () =>
                                  _sendMessage('Where should I start?'),
                            ),
                            _HeroQuickReplyButton(
                              text: 'What do you do ?',
                              onPressed: () => _sendMessage('What do you do ?'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _HeroQuickReplyButton(
                          text: 'I have a project',
                          onPressed: () => _sendMessage('I have a project'),
                        ),
                      ],
                    ),
                  ),
                _HeroChatInput(controller: _controller, onSend: _sendMessage),
                if (_isSending)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'MindBridge AI is thinking...',
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
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

class VideoPlayerCard extends StatelessWidget {
  const VideoPlayerCard({
    super.key,
    required this.videoAssetPath,
    required this.overlayColor,
  });

  final String videoAssetPath;
  final Color overlayColor;

  @override
  Widget build(BuildContext context) {
    return _InlineVideoPlayer(
      videoAssetPath: videoAssetPath,
      overlayColor: overlayColor,
    );
  }
}

class _InlineVideoPlayer extends StatefulWidget {
  const _InlineVideoPlayer({
    required this.videoAssetPath,
    required this.overlayColor,
  });

  final String videoAssetPath;
  final Color overlayColor;

  @override
  State<_InlineVideoPlayer> createState() => _InlineVideoPlayerState();
}

class _InlineVideoPlayerState extends State<_InlineVideoPlayer> {
  late final VideoPlayerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.asset(widget.videoAssetPath)
      ..setLooping(true)
      ..setVolume(0);
    _controller.initialize().then((_) {
      if (!mounted) return;
      setState(() {});
      _controller.play();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (_controller.value.isInitialized)
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _controller.value.size.width,
              height: _controller.value.size.height,
              child: VideoPlayer(_controller),
            ),
          )
        else
          Container(color: Colors.black),
        Container(color: widget.overlayColor),
      ],
    );
  }
}

class _HeroQuickReplyButton extends StatelessWidget {
  const _HeroQuickReplyButton({required this.text, required this.onPressed});

  final String text;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF2E2F6B),
        foregroundColor: Colors.white,
        elevation: 0,
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      ),
      onPressed: onPressed,
      child: Text(
        text,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w300),
      ),
    );
  }
}

class _HeroChatInput extends StatelessWidget {
  const _HeroChatInput({required this.controller, required this.onSend});

  final TextEditingController controller;
  final ValueChanged<String> onSend;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              onSubmitted: onSend,
              decoration: InputDecoration(
                hintText: 'Ask me anything...',
                filled: true,
                fillColor: const Color(0xFFF3F3F3),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(999),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2E2F6B),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              shape: const StadiumBorder(),
            ),
            onPressed: () => onSend(controller.text),
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }
}

class _ChatMessage {
  const _ChatMessage({
    required this.role,
    required this.content,
    this.sources = const [],
  });

  final String role;
  final String content;
  final List<ChatSource> sources;

  bool get isThinking => role == 'thinking';
}
