import 'package:area_from_json/src/service/auth.service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/workflow_node.dart';
import 'draggable_node_item.dart';

class NodeDrawer extends StatefulWidget {
  final Animation<Offset> animation;

  const NodeDrawer({
    Key? key,
    required this.animation,
  }) : super(key: key);

  @override
  State<NodeDrawer> createState() => _NodeDrawerState();
}

class _NodeDrawerState extends State<NodeDrawer> {
  List<dynamic> _actions = [];
  List<dynamic> _reactions = [];
  bool _isLoading = true;
  String? _errorMessage;
  String get apiBaseUrl => dotenv.env['API_URL'] ?? 'http://localhost:3000';

  @override
  void initState() {
    super.initState();
    _fetchNodes();
  }

  Future<void> _fetchNodes() async {
    try {
      final headers = await AuthService.getAuthHeaders();
      final response = await http.get(
        Uri.parse('$apiBaseUrl/area'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _actions = data['actions'] ?? [];
          _reactions = data['reactions'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load nodes: ${response.statusCode}';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error connecting to API: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: widget.animation,
      child: Container(
        width: 280,
        height: MediaQuery.of(context).size.height,
        color: const Color(0xFFF8FAFC),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Nodes Bank',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Drag and drop to add',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _errorMessage != null
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.error_outline,
                                      size: 48, color: Colors.red[300]),
                                  const SizedBox(height: 16),
                                  Text(
                                    _errorMessage!,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: () {
                                      setState(() {
                                        _isLoading = true;
                                        _errorMessage = null;
                                      });
                                      _fetchNodes();
                                    },
                                    child: const Text('Retry'),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : Theme(
                            data: Theme.of(context).copyWith(
                              dividerColor: Colors.transparent,
                            ),
                            child: ListView(
                              padding: const EdgeInsets.all(16),
                              children: [
                                _buildAccordionSection(
                                  title: 'Triggers Nodes',
                                  initiallyExpanded: false,
                                  children: _buildTriggerNodes(),
                                ),
                                const SizedBox(height: 16),
                                _buildAccordionSection(
                                  title: 'Reactions Nodes',
                                  initiallyExpanded: false,
                                  children: _buildReactionNodes(),
                                ),
                                const SizedBox(height: 16),
                                _buildAccordionSection(
                                  title: 'Logic Nodes',
                                  initiallyExpanded: false,
                                  children: [
                                    DraggableNodeItem(
                                      logicType: LogicType.IF,
                                      actionId: null,
                                      reactionId: null,
                                      title: 'IF Node',
                                      description: 'Evaluates a condition',
                                      icon: Icons.call_split,
                                      color: Colors.blue,
                                    ),
                                    const SizedBox(height: 12),
                                    DraggableNodeItem(
                                      logicType: LogicType.AND,
                                      actionId: null,
                                      reactionId: null,
                                      title: 'AND Node',
                                      description: 'All inputs must be true',
                                      icon: Icons.merge_type,
                                      color: Colors.blue,
                                    ),
                                    const SizedBox(height: 12),
                                    DraggableNodeItem(
                                      logicType: LogicType.NOT,
                                      actionId: null,
                                      reactionId: null,
                                      title: 'NOT Node',
                                      description: 'Inverts the input value',
                                      icon: Icons.swap_horiz,
                                      color: Colors.blue,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
              )
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildTriggerNodes() {
    if (_actions.isEmpty) {
      return [
        Container(
          padding: const EdgeInsets.all(16),
          child: Text(
            'No trigger nodes available, you should add your credentials on the credentials page',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ];
    }
    return _actions.map((action) {
      final actionId = action['id'] is int ? action['id'] as int : int.tryParse(action['id']?.toString() ?? '') ;
      final name = action['name'] as String? ?? 'Unknown';
      final description = action['description'] as String? ?? '';
      // compute default conf from parameters/inputs
      Map<String, dynamic> defaultConf = {};
      try {
        final rawParams = action['parameters'] ?? action['inputs'] ?? [];
        for (var p in (rawParams as List<dynamic>)) {
          final pname = p['name']?.toString() ?? p['key']?.toString() ?? '';
          final ptype = (p['type'] ?? 'string').toString();
          final pdefault = p['default'];
          if (pdefault != null) {
            defaultConf[pname] = pdefault;
          } else if (ptype == 'boolean') {
            defaultConf[pname] = false;
          } else if (ptype == 'number') {
            defaultConf[pname] = null;
          } else {
            defaultConf[pname] = '';
          }
        }
      } catch (_) {}
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: DraggableNodeItem(
          logicType: null,
          actionId: actionId,
          reactionId: null,
          title: name,
          description: description,
          conf: defaultConf,
          icon: _getIconForService(action['serviceType']),
          color: Colors.green,
        ),
      );
    }).toList();
  }

  List<Widget> _buildReactionNodes() {
    if (_reactions.isEmpty) {
      return [
        Container(
          padding: const EdgeInsets.all(16),
          child: Text(
            'No reaction nodes available, you should add your credentials on the credentials page',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ];
    }
    return _reactions.map((reaction) {
      final reactionId = reaction['id'] is int ? reaction['id'] as int : int.tryParse(reaction['id']?.toString() ?? '');
      final name = reaction['name'] as String? ?? 'Unknown';
      final description = reaction['description'] as String? ?? '';
      Map<String, dynamic> defaultConf = {};
      try {
        final rawParams = reaction['parameters'] ?? reaction['inputs'] ?? [];
        for (var p in (rawParams as List<dynamic>)) {
          final pname = p['name']?.toString() ?? p['key']?.toString() ?? '';
          final ptype = (p['type'] ?? 'string').toString();
          final pdefault = p['default'];
          if (pdefault != null) {
            defaultConf[pname] = pdefault;
          } else if (ptype == 'boolean') {
            defaultConf[pname] = false;
          } else if (ptype == 'number') {
            defaultConf[pname] = null;
          } else {
            defaultConf[pname] = '';
          }
        }
      } catch (_) {}
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: DraggableNodeItem(
          logicType: null,
          actionId: null,
          reactionId: reactionId,
          title: name,
          description: description,
          conf: defaultConf,
          icon: _getIconForService(reaction['serviceType']),
          color: Colors.orange,
        ),
      );
    }).toList();
  }

  IconData _getIconForService(String? serviceType) {
    switch (serviceType?.toLowerCase()) {
      case 'gmail':
        return Icons.email;
      case 'slack':
        return Icons.chat;
      case 'github':
        return Icons.code;
      case 'calendar':
        return Icons.calendar_today;
      default:
        return Icons.extension;
    }
  }

  Widget _buildAccordionSection({
    required String title,
    required List<Widget> children,
    bool initiallyExpanded = false,
  }) {
    return ExpansionTile(
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Color(0xFF0F172A),
        ),
      ),
      initiallyExpanded: initiallyExpanded,
      collapsedBackgroundColor: Colors.grey[50],
      backgroundColor: Colors.grey[50],
      childrenPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      collapsedIconColor: Colors.grey[600],
      iconColor: Colors.grey[600],
      collapsedTextColor: const Color(0xFF0F172A),
      textColor: const Color(0xFF0F172A),
      children: children,
    );
  }
}
