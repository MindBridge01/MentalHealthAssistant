import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

// Doctor Model
class Doctor {
  const Doctor({
    required this.userId,
    required this.name,
    required this.specialty,
    required this.bio,
    this.slots,
  });

  final String userId;
  final String name;
  final String specialty;
  final String bio;
  final List<String>? slots;

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      userId: json['userId'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      specialty: json['specialty'] ?? '',
      bio: json['bio'] ?? '',
      slots: List<String>.from(json['slots'] ?? []),
    );
  }
}

// Appointment Model
class Appointment {
  const Appointment({
    required this.id,
    required this.doctorId,
    required this.doctorName,
    required this.date,
    required this.time,
    required this.status,
    this.notes,
  });

  final String id;
  final String doctorId;
  final String doctorName;
  final String date;
  final String time;
  final String status; // 'confirmed', 'pending', 'completed', 'cancelled'
  final String? notes;

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['_id'] ?? json['id'] ?? '',
      doctorId: json['doctorId'] ?? '',
      doctorName: json['doctorName'] ?? 'MindBridge Doctor',
      date: json['date'] ?? '',
      time: json['time'] ?? '',
      status: json['status'] ?? 'confirmed',
      notes: json['notes'] as String?,
    );
  }
}

// Community Post Model
class CommunityPost {
  const CommunityPost({
    required this.id,
    required this.name,
    required this.caption,
    this.location,
    this.image,
    required this.likes,
    required this.savedCount,
    required this.commentsCount,
    required this.viewerHasLiked,
    required this.viewerHasSaved,
    this.comments,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String caption;
  final String? location;
  final String? image;
  final int likes;
  final int savedCount;
  final int commentsCount;
  final bool viewerHasLiked;
  final bool viewerHasSaved;
  final List<PostComment>? comments;
  final DateTime createdAt;

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    final rawComments = json['comments'] as List<dynamic>? ?? [];
    final comments = rawComments
        .whereType<Map<String, dynamic>>()
        .map((c) => PostComment(
          id: c['_id'] ?? '',
          authorName: c['authorName'] ?? 'Anonymous',
          content: c['content'] ?? '',
        ))
        .toList();

    return CommunityPost(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      caption: json['caption'] ?? '',
      location: json['location'] as String?,
      image: json['image'] as String?,
      likes: json['likes'] ?? 0,
      savedCount: json['savedCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? 0,
      viewerHasLiked: json['viewerHasLiked'] ?? false,
      viewerHasSaved: json['viewerHasSaved'] ?? false,
      comments: comments,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }
}

class PostComment {
  const PostComment({
    required this.id,
    required this.authorName,
    required this.content,
  });

  final String id;
  final String authorName;
  final String content;
}

class DoctorService {
  DoctorService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  /// Fetch all doctors
  Future<List<Doctor>> getDoctors() async {
    final response = await _client.getJson(
      Uri.parse('$_defaultBaseUrl/api/doctor'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load doctors');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! List<dynamic>) {
      throw Exception('Unexpected response format');
    }

    return decoded
        .whereType<Map<String, dynamic>>()
        .map(Doctor.fromJson)
        .toList();
  }

  /// Search doctors by name or specialty
  Future<List<Doctor>> searchDoctors(String query) async {
    final doctors = await getDoctors();
    final needle = query.toLowerCase().trim();
    
    if (needle.isEmpty) return doctors;
    
    return doctors
        .where((doctor) =>
            doctor.name.toLowerCase().contains(needle) ||
            doctor.specialty.toLowerCase().contains(needle) ||
            doctor.bio.toLowerCase().contains(needle))
        .toList();
  }
}

class AppointmentService {
  AppointmentService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  /// Get patient appointments
  Future<List<Appointment>> getAppointments() async {
    final response = await _client.getJson(
      Uri.parse('$_defaultBaseUrl/api/appointment'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load appointments');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    final appointments = decoded['appointments'] as List<dynamic>? ?? [];
    return appointments
        .whereType<Map<String, dynamic>>()
        .map(Appointment.fromJson)
        .toList();
  }

  /// Book an appointment
  Future<Appointment> bookAppointment({
    required String doctorId,
    required String date,
    required String time,
    String? notes,
  }) async {
    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/appointment/book'),
      body: {
        'doctorId': doctorId,
        'date': date,
        'time': time,
        if (notes != null) 'notes': notes,
      },
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to book appointment');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return Appointment.fromJson(decoded['appointment']);
  }

  /// Cancel appointment
  Future<void> cancelAppointment(String appointmentId) async {
    final response = await _client.deleteJson(
      Uri.parse('$_defaultBaseUrl/api/appointment/$appointmentId'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to cancel appointment');
    }
  }
}

class CommunityService {
  CommunityService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
  );

  /// Get community posts
  Future<List<CommunityPost>> getPosts() async {
    final response = await _client.getJson(
      Uri.parse('$_defaultBaseUrl/api/patient/community/posts'),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load posts');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    final posts = decoded['posts'] as List<dynamic>? ?? [];
    return posts
        .whereType<Map<String, dynamic>>()
        .map(CommunityPost.fromJson)
        .toList();
  }

  /// Get single post
  Future<CommunityPost> getPost(String postId) async {
    final response = await _client.getJson(
      Uri.parse('$_defaultBaseUrl/api/patient/community/posts/$postId'),
    );

    if (response.statusCode != 200) {
      throw Exception('Post not found');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return CommunityPost.fromJson(decoded['post']);
  }

  /// Create post
  Future<CommunityPost> createPost({
    required String caption,
    String? location,
    String? image,
  }) async {
    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/patient/community/posts'),
      body: {
        'caption': caption,
        if (location != null) 'location': location,
        if (image != null) 'image': image,
      },
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to create post');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return CommunityPost.fromJson(decoded['post']);
  }

  /// Like/unlike post
  Future<CommunityPost> toggleLike(String postId) async {
    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/patient/community/posts/$postId/like'),
      body: {},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to like post');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return CommunityPost.fromJson(decoded['post']);
  }

  /// Save/unsave post
  Future<CommunityPost> toggleSave(String postId) async {
    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/patient/community/posts/$postId/save'),
      body: {},
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to save post');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return CommunityPost.fromJson(decoded['post']);
  }

  /// Add comment
  Future<CommunityPost> addComment(String postId, String content) async {
    final response = await _client.postJson(
      Uri.parse('$_defaultBaseUrl/api/patient/community/posts/$postId/comments'),
      body: {'content': content},
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to add comment');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    return CommunityPost.fromJson(decoded['post']);
  }
}
