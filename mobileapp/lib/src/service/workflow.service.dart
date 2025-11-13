import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import './auth.service.dart';

class WorkflowService {
  static String get baseUrl => dotenv.env['API_URL'] ?? '';

  static Future<Map<String, String>> get _headers async {
    return await AuthService.getAuthHeaders();
  }

  static Future<List<Map<String, dynamic>>> getWorkflows() async {
    final response = await http.get(
      Uri.parse('$baseUrl/workflow'),
      headers: await _headers,
    );
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(json.decode(response.body));
    } else {
      throw Exception('Failed to load workflows: ${response.statusCode}');
    }
  }

  static Future<Map<String, dynamic>> createWorkflow(String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/workflow'),
      headers: await _headers,
      body: json.encode({'name': name}),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create workflow: ${response.statusCode}');
    }
  }

  static Future<Map<String, dynamic>> updateWorkflow(int workflowId, String name) async {
    final response = await http.put(
      Uri.parse('$baseUrl/workflow/$workflowId'),
      headers: await _headers,
      body: json.encode({'name': name}),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to update workflow: ${response.statusCode}');
    }
  }

  static Future<void> deleteWorkflow(int workflowId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/workflow/$workflowId'),
      headers: await _headers,
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete workflow: ${response.statusCode}');
    }
  }

  static Future<Map<String, dynamic>> createNode({
    required int workflowId,
    required String name,
    required String? logicType,
    required int? actionId,
    required int? reactionId,
    required Map<String, dynamic> conf,
    required double positionX,
    required double positionY,
  }) async {
    final body = {
      'name': name,
      'conf': conf,
      'positionX': positionX,
      'positionY': positionY,
    };
    if (logicType != null && logicType.isNotEmpty) {
      body['logicType'] = logicType;
    }
    if (actionId != null) {
      body['actionId'] = actionId;
    }
    if (reactionId != null) {
      body['reactionId'] = reactionId;
    }
    final response = await http.post(
      Uri.parse('$baseUrl/workflow/$workflowId/node'),
      headers: await _headers,
      body: json.encode(body),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create node: ${response.statusCode}');
    }
  }

  static Future<void> createConnection({
    required int workflowId,
    required int sourceNodeId,
    required int targetNodeId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/workflow/$workflowId/connection'),
      headers: await _headers,
      body: json.encode({
        'sourceNodeId': sourceNodeId,
        'targetNodeId': targetNodeId,
      }),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception('Failed to create connection: ${response.statusCode}');
    }
  }

  static Future<void> deleteNode({
    required int workflowId,
    required int nodeId,
  }) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/workflow/$workflowId/node/$nodeId'),
      headers: await _headers,
    );
    if (response.statusCode != 200 && response.statusCode != 204) {
      throw Exception('Failed to delete node: ${response.statusCode}');
    }
  }

  static Future<Map<String, dynamic>> updateNode({
    required int workflowId,
    required int nodeId,
    required String name,
    required String logicType,
    required Map<String, dynamic> conf,
    required double positionX,
    required double positionY,
  }) async {
    final response = await http.put(
      Uri.parse('$baseUrl/workflow/$workflowId/node/$nodeId'),
      headers: await _headers,
      body: json.encode({
        'name': name,
        'logicType': logicType,
        'conf': conf,
        'positionX': positionX,
        'positionY': positionY,
      }),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to update node: ${response.statusCode}');
    }
  }
}
