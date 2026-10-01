import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class PostWidget extends StatelessWidget {
  final Map<String, dynamic> post;
  final String imageUrl;

  const PostWidget({Key? key, required this.post, required this.imageUrl}) : super(key: key);

  Future<void> handleAction(String action) async {
    try {
      await http.patch(
        Uri.parse('http://localhost:3000/api/posts/${post['_id']}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'action': action}),
      );
      // Optimistically update UI (re-fetch posts in parent if needed)
    } catch (error) {
      debugPrint('Error performing $action: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0x40B5B5B5),
            blurRadius: 17.38,
            offset: const Offset(0, 4.97),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header: User Info
          Container(
            height: 64.56,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Stack(
              children: [
                Positioned(
                  top: 13,
                  left: 18,
                  child: Container(
                    width: 41,
                    height: 41,
                    decoration: const BoxDecoration(
                      color: Color(0xFF2ab1ec),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Positioned(
                  top: 16,
                  left: 69,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post['author'] ?? 'Rikki Janae',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: Color(0xFF1a3c6d),
                          letterSpacing: 0.015,
                        ),
                      ),
                      Text(
                        post['location'] ?? ' ',
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 10,
                          color: Color(0xFF6b7280),
                          letterSpacing: 0.015,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Post Image
          SizedBox(
            height: 370,
            width: double.infinity,
            child: ClipRRect(
              borderRadius: BorderRadius.zero,
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
              ),
            ),
          ),
          // Caption
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              post['caption'] ?? '',
              style: const TextStyle(fontSize: 14, color: Colors.black87),
            ),
          ),
          // Footer: Action Buttons
          Container(
            height: 49.66,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
            ),
            child: Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 14, bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.favorite_border, color: Color(0xFF1a3c6d)),
                        iconSize: 24,
                        onPressed: () => handleAction('like'),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chat_bubble_outline, color: Color(0xFF1a3c6d)),
                        iconSize: 24,
                        onPressed: () => handleAction('comment'),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.bookmark_border, color: Color(0xFF1a3c6d)),
                    iconSize: 24,
                    onPressed: () => handleAction('save'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
