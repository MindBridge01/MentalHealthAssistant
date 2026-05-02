import 'dart:convert';

import 'package:flutter/foundation.dart';

import 'api_client.dart';

class ChatMessagePayload {
  const ChatMessagePayload({required this.role, required this.content});

  final String role;
  final String content;

  Map<String, dynamic> toJson() => {
        'role': role,
        'content': content,
      };
}

class ChatSource {
  const ChatSource({
    required this.title,
    required this.documentKey,
    required this.similarity,
  });

  final String title;
  final String documentKey;
  final double? similarity;

  factory ChatSource.fromJson(Map<String, dynamic> json) {
    return ChatSource(
      title: json['title']?.toString() ?? 'Source',
      documentKey: json['documentKey']?.toString() ?? '',
      similarity: (json['similarity'] as num?)?.toDouble(),
    );
  }
}

class ChatReply {
  const ChatReply({
    required this.content,
    required this.sources,
    this.safety,
  });

  final String content;
  final List<ChatSource> sources;
  final Map<String, dynamic>? safety;

  factory ChatReply.fromJson(Map<String, dynamic> json) {
    final sources = (json['sources'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ChatSource.fromJson)
        .toList();

    return ChatReply(
      content: json['content']?.toString() ?? '',
      sources: sources,
      safety: json['safety'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['safety'] as Map)
          : null,
    );
  }
}

class ChatService {
  ChatService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  Future<ChatReply> sendMessage({
    required String message,
    required List<ChatMessagePayload> messages,
  }) async {
    final token = await _client.readToken();
    final isAuthenticated = token != null && token.isNotEmpty;
    final path = isAuthenticated ? '/api/chat' : '/api/public-chat';

    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl$path'),
      body: {
        'message': message,
        'messages': messages.map((item) => item.toJson()).toList(),
      },
    );

    if (response.body.isEmpty) {
      throw StateError('Empty response from chat backend');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw StateError('Unexpected chat response format');
    }

    return ChatReply.fromJson(decoded);
  }

  Future<void> saveConversation(List<ChatMessagePayload> messages) async {
    if (messages.length <= 1) return;

    await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/save-conversation'),
      body: {
        'messages': messages.map((item) => item.toJson()).toList(),
      },
    );
  }
}