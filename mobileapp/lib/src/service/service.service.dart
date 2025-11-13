import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import './auth.service.dart';

class ServiceService {
  static String get baseUrl => dotenv.env['API_URL'] ?? '';

  static Future<Map<String, String>> get _headers async {
    return await AuthService.getAuthHeaders();
  }

  static Future<List<Map<String, dynamic>>> getServices() async {
    // Try /services first, then fallback to /area which returns a flat actions/reactions shape
    final headers = await _headers;
    try {
      final uri = Uri.parse('$baseUrl/services');
      final response = await http.get(uri, headers: headers);
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(json.decode(response.body));
      }
    } catch (_) {
      // ignore and try fallback
    }

    // fallback: some backends expose /area with actions/reactions (flat lists)
    try {
      final uri2 = Uri.parse('$baseUrl/area');
      final res2 = await http.get(uri2, headers: headers);
      if (res2.statusCode == 200) {
        final body = json.decode(res2.body);
        if (body is Map<String, dynamic>) {
          final Map<String, Map<String, dynamic>> byService = {};
          final actions = (body['actions'] as List<dynamic>?) ?? [];
          final reactions = (body['reactions'] as List<dynamic>?) ?? [];
          for (var a in actions) {
            final st = (a['serviceType'] ?? a['service'] ?? 'UNKNOWN').toString();
            byService.putIfAbsent(st, () => {'id': st, 'name': st, 'actions': <dynamic>[], 'reactions': <dynamic>[], 'icon': '', 'description': ''});
            // normalize parameters -> inputs for compatibility
            if (a is Map && a['parameters'] != null && a['inputs'] == null) {
              a['inputs'] = a['parameters'];
            }
            byService[st]!['actions'].add(a);
          }
          for (var r in reactions) {
            final st = (r['serviceType'] ?? r['service'] ?? 'UNKNOWN').toString();
            byService.putIfAbsent(st, () => {'id': st, 'name': st, 'actions': <dynamic>[], 'reactions': <dynamic>[], 'icon': '', 'description': ''});
            if (r is Map && r['parameters'] != null && r['inputs'] == null) {
              r['inputs'] = r['parameters'];
            }
            byService[st]!['reactions'].add(r);
          }
          return byService.values.map((m) => Map<String, dynamic>.from(m)).toList();
        }
      }
    } catch (_) {}

    throw Exception('Failed to load services from $baseUrl/services or $baseUrl/area');
  }
}
