import 'package:flutter/material.dart';

import '../components/Navbar.dart';
import '../services/chat_service.dart';

class AiChatPage extends StatefulWidget {
  const AiChatPage({super.key});

  @override
  State<AiChatPage> createState() => _AiChatPageState();
}

class _AiChatPageState extends State<AiChatPage> {
  final _chatService = ChatService();
  final _inputController = TextEditingController();

  final List<_ChatEntry> _messages = [
    const _ChatEntry(
      role: 'assistant',
      content:
          'Hi, I\'m MindBridge AI. I can help with grounding, reflection, and supportive next steps.',
    ),
  ];

  final List<String> _suggestions = const [
    'I feel overwhelmed',
    'How do I manage stress?',
    'I need someone to talk to',
    'Tips for better sleep?',
  ];

  bool _isSending = false;
  bool _isCrisis = false;
  String? _error;

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage([String? overrideText]) async {
    if (_isSending) return;

    final text = (overrideText ?? _inputController.text).trim();
    if (text.isEmpty) return;

    final userMessage = _ChatEntry(role: 'user', content: text);
    final updatedMessages = [..._messages, userMessage];
    final history = updatedMessages
        .map((message) => ChatMessagePayload(role: message.role, content: message.content))
        .toList();

    setState(() {
      _messages
        ..add(userMessage)
        ..add(const _ChatEntry(role: 'thinking', content: 'MindBridge AI is thinking...'));
      _inputController.clear();
      _isSending = true;
      _error = null;
      _isCrisis = false;
    });

    try {
      final reply = await _chatService.sendMessage(message: text, messages: history);
      if (!mounted) return;

      setState(() {
        _messages.removeWhere((message) => message.role == 'thinking');
        _messages.add(
          _ChatEntry(
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
          const _ChatEntry(
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
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF7FAFF), Color(0xFFEFF4FF), Color(0xFFFFFFFF)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              AppNavbar(
                onProfileTap: () => Navigator.of(context).pushNamed('/profile-settings'),
                onSosTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('SOS help button tapped'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth >= 900;
                    final sideWidth = isWide ? 320.0 : 0.0;

                    return Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: isWide ? 24 : 16,
                        vertical: 16,
                      ),
                      child: isWide
                          ? Row(
                              children: [
                                Expanded(child: _buildChatPanel(context)),
                                const SizedBox(width: 24),
                                SizedBox(
                                  width: sideWidth,
                                  child: _buildSupportPanel(),
                                ),
                              ],
                            )
                          : Column(
                              children: [
                                Expanded(child: _buildChatPanel(context)),
                                const SizedBox(height: 12),
                                _buildSupportPanel(),
                              ],
                            ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChatPanel(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: const Color(0xFFE6ECF7)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 30,
            offset: Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AI Chat',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E2A4A),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'A supportive place to talk things through. The assistant uses your backend safety filters and knowledge retrieval.',
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.5,
                    color: Colors.blueGrey.shade600,
                  ),
                ),
                if (_isCrisis) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFFECDD3)),
                    ),
                    child: const Text(
                      'A higher-risk message was detected. Please prioritize immediate human support or use SOS.',
                      style: TextStyle(
                        color: Color(0xFF9F1239),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(18),
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
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _ChatBubble(message: message);
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
            child: Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _suggestions
                  .map(
                    (text) => ActionChip(
                      backgroundColor: const Color(0xFFEAF1FF),
                      side: BorderSide.none,
                      label: Text(
                        text,
                        style: const TextStyle(
                          color: Color(0xFF21407A),
                          fontSize: 12,
                        ),
                      ),
                      onPressed: _isSending ? null : () => _sendMessage(text),
                    ),
                  )
                  .toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: _Composer(
              controller: _inputController,
              isSending: _isSending,
              onSend: _sendMessage,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSupportPanel() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF22325A),
        borderRadius: BorderRadius.circular(28),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: const [
          Text(
            'Support Tips',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 12),
          Text(
            '• Be specific about what you are feeling.',
            style: TextStyle(color: Colors.white70, height: 1.5),
          ),
          SizedBox(height: 8),
          Text(
            '• Use one of the quick prompts to start.',
            style: TextStyle(color: Colors.white70, height: 1.5),
          ),
          SizedBox(height: 8),
          Text(
            '• If you are in danger, use SOS or emergency services.',
            style: TextStyle(color: Colors.white70, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _ChatEntry {
  const _ChatEntry({
    required this.role,
    required this.content,
    this.sources = const [],
  });

  final String role;
  final String content;
  final List<ChatSource> sources;

  bool get isThinking => role == 'thinking';
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});

  final _ChatEntry message;

  @override
  Widget build(BuildContext context) {
    if (message.isThinking) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Align(
          alignment: Alignment.centerLeft,
          child: Container(
            constraints: const BoxConstraints(maxWidth: 260),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF4F7FD),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'MindBridge AI is thinking...',
              style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
            ),
          ),
        ),
      );
    }

    final isUser = message.role == 'user';
    final bubbleColor = isUser ? const Color(0xFF2E2F6B) : const Color(0xFFF4F7FD);
    final textColor = isUser ? Colors.white : const Color(0xFF1E293B);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Align(
        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: bubbleColor,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.content,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                if (message.sources.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: message.sources
                        .map(
                          (source) => Chip(
                            label: Text(
                              source.title,
                              style: const TextStyle(fontSize: 11),
                            ),
                            backgroundColor: Colors.white,
                            visualDensity: VisualDensity.compact,
                            side: BorderSide.none,
                          ),
                        )
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.controller,
    required this.isSending,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool isSending;
  final ValueChanged<String> onSend;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: controller,
            enabled: !isSending,
            minLines: 1,
            maxLines: 4,
            textInputAction: TextInputAction.send,
            onSubmitted: onSend,
            decoration: InputDecoration(
              hintText: 'Type what is on your mind...',
              filled: true,
              fillColor: const Color(0xFFF8FAFF),
              contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: const BorderSide(color: Color(0xFF2E2F6B), width: 1.4),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        ElevatedButton(
          onPressed: isSending ? null : () => onSend(controller.text),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2E2F6B),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          ),
          child: Text(isSending ? 'Sending...' : 'Send'),
        ),
      ],
    );
  }
}