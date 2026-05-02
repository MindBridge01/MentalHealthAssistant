import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ApiClient extends http.BaseClient {
  ApiClient({http.Client? innerClient, FlutterSecureStorage? storage})
      : _inner = innerClient ?? http.Client(),
        _storage = storage ?? const FlutterSecureStorage();

  final http.Client _inner;
  final FlutterSecureStorage _storage;

  static const String tokenKey = 'auth_token';

  Future<void> saveToken(String token) => _storage.write(key: tokenKey, value: token);

  Future<String?> readToken() => _storage.read(key: tokenKey);

  Future<void> clearToken() => _storage.delete(key: tokenKey);

  Future<Map<String, String>> _prepareHeaders(Map<String, String>? headers) async {
    final prepared = <String, String>{
      'Content-Type': 'application/json',
      ...?headers,
    };

    final token = await readToken();
    if (token != null && token.isNotEmpty) {
      prepared['Authorization'] = 'Bearer $token';
    }

    return prepared;
  }

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final token = await readToken();
    if (token != null && token.isNotEmpty && !request.headers.containsKey('Authorization')) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    return _inner.send(request);
  }

  Future<http.Response> getJson(Uri uri, {Map<String, String>? headers}) async {
    return http.get(uri, headers: await _prepareHeaders(headers));
  }

  Future<http.Response> postJson(
    Uri uri, {
    Object? body,
    Map<String, String>? headers,
  }) async {
    return http.post(
      uri,
      headers: await _prepareHeaders(headers),
      body: body == null ? null : jsonEncode(body),
    );
  }

  Future<http.Response> put(
    Uri url, {
    Map<String, String>? headers,
    Object? body,
    Encoding? encoding,
  }) async {
    final preparedHeaders = await _prepareHeaders(headers);
    return http.put(
      url,
      headers: preparedHeaders,
      body: body == null ? null : jsonEncode(body),
      encoding: encoding,
    );
  }

  Future<http.Response> putPath(
    String path, {
    Object? body,
    Map<String, String>? headers,
  }) async {
    final baseUrl = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000',
    );
    final uri = Uri.parse(path.startsWith('http') ? path : '$baseUrl$path');
    return put(uri, headers: headers, body: body);
  }

  Future<http.Response> deleteJson(Uri uri, {Map<String, String>? headers}) async {
    return http.delete(uri, headers: await _prepareHeaders(headers));
  }

  @override
  void close() {
    _inner.close();
    super.close();
  }
}
