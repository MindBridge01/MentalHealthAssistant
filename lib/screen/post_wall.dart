import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../widgets/post_widget.dart';

class PostWall extends StatefulWidget {
  const PostWall({Key? key}) : super(key: key);

  @override
  State<PostWall> createState() => _PostWallState();
}

class _PostWallState extends State<PostWall> {
  List<Map<String, dynamic>> posts = [];
  String? error;

  // Demo images (update these paths as needed)
  final List<String> postImages = [
    'lib/assests/images/post1.jpg',
    'lib/assests/images/post2.jpg',
    'lib/assests/images/post3.jpg',
    'lib/assests/images/post4.jpg',
    'lib/assests/images/post5.jpg',
    'lib/assests/images/post6.jpg',
  ];

  @override
  void initState() {
    super.initState();
    fetchPosts();
    // Poll every 5 seconds
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 5));
      if (!mounted) return false;
      await fetchPosts();
      return true;
    });
  }

  Future<void> fetchPosts() async {
    try {
      final response = await http.get(Uri.parse('http://localhost:3000/api/posts'));
      if (response.statusCode != 200) {
        throw Exception('Failed to fetch posts');
      }
      final List<dynamic> data = jsonDecode(response.body);
      final postsWithImages = data.asMap().entries.map((entry) {
        final index = entry.key;
        final post = Map<String, dynamic>.from(entry.value);
        return {
          ...post,
          'image': postImages[index % postImages.length],
        };
      }).toList();
      setState(() {
        posts = postsWithImages;
        error = null;
      });
    } catch (e) {
      setState(() {
        error = 'Unable to load posts. Please try again later.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
        child: Column(
          children: [
            Column(
              children: const [
                Text(
                  'Watch What Others Are Sharing',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 32,
                    color: Color(0xFF1a3c6d),
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  "A place to share your thoughts and feelings. So let’s try fast enough to fit anywhere.",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.normal,
                    fontSize: 18,
                    color: Color(0xFF1a3c6d),
                  ),
                ),
                SizedBox(height: 24),
              ],
            ),
            if (error != null)
              Text(error!, style: const TextStyle(color: Colors.red, fontSize: 16)),
            if (error == null && posts.isEmpty)
              const Text('No posts yet. Be the first to share!', style: TextStyle(color: Colors.grey, fontSize: 16)),
            if (error == null && posts.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 1,
                  crossAxisSpacing: 24,
                  mainAxisSpacing: 24,
                  childAspectRatio: 0.65,
                ),
                itemCount: posts.length,
                itemBuilder: (context, index) {
                  final post = posts[index];
                  return PostWidget(post: post, imageUrl: post['image']);
                },
              ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}
