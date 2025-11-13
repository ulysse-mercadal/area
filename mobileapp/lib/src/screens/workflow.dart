import 'package:flutter/material.dart';
import '../widgets/bottom_nav_bar.dart';
import '../widgets/node_drawer.dart';
import '../widgets/workflow_node_card.dart';
import '../models/workflow_node.dart';
import '../models/drag_data.dart';
import '../service/workflow.service.dart';
import '../service/service.service.dart';

class WorkflowPage extends StatefulWidget {
  const WorkflowPage({Key? key}) : super(key: key);

  @override
  State<WorkflowPage> createState() => _WorkflowPageState();
}

class _WorkflowPageState extends State<WorkflowPage>
    with TickerProviderStateMixin {
  final List<WorkflowNode> _rootNodes = [];
  List<int> _deletedNodeServerIds = [];
  bool _isDrawerOpen = false;
  late AnimationController _drawerController;
  late Animation<Offset> _drawerAnimation;
  int? _currentWorkflowId;
  bool _isLoading = true;
  bool _isListing = true;
  List<Map<String, dynamic>> _workflows = [];
  bool _isSaving = false;
  Map<String, int> _nodeIdMapping = {};
  List<Map<String, dynamic>> _services = [];

  @override
  void initState() {
    super.initState();
    _drawerController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _drawerAnimation = Tween<Offset>(
      begin: const Offset(-1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _drawerController,
      curve: Curves.easeInOut,
    ));
    _loadWorkflow();
    _loadServices();
  }

  Future<void> _loadServices() async {
    try {
      final services = await ServiceService.getServices();
      setState(() {
        _services = services;
      });
    } catch (e) {
      setState(() {
        _services = [];
      });
    }
  }

  Future<void> _loadWorkflow() async {
    try {
      setState(() {
        _isLoading = true;
        _isListing = true;
      });
      final workflows = await WorkflowService.getWorkflows();
      _workflows = workflows;
      if (workflows.isNotEmpty) {
      }
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() => _isLoading = false);
      _showErrorDialog('Failed to load workflow: $e');
    }
  }

  Future<void> _openWorkflow(Map<String, dynamic> workflow) async {
    setState(() {
      _isListing = false;
      _isLoading = true;
    });
    _currentWorkflowId = workflow['id'];
    await _loadNodesFromWorkflow(workflow);
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _createAndOpenWorkflow() async {
    final name = await _promptForName(context, 'New workflow name', 'New Workflow');
    if (name == null || name.isEmpty) return;
    setState(() => _isLoading = true);
    final newWorkflow = await WorkflowService.createWorkflow(name);
    _workflows.insert(0, newWorkflow);
    await _openWorkflow(newWorkflow);
    setState(() => _isLoading = false);
  }

  Future<String?> _promptForName(BuildContext context, String title, String initial) async {
    final controller = TextEditingController(text: initial);
    return showDialog<String?>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(controller: controller, decoration: const InputDecoration()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('OK')),
        ],
      ),
    );
  }

  Future<void> _renameWorkflow(Map<String, dynamic> wf) async {
    final name = await _promptForName(context, 'Rename workflow', wf['name'] ?? '');
    if (name == null || name.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final updated = await WorkflowService.updateWorkflow(wf['id'] as int, name);
      final idx = _workflows.indexWhere((w) => w['id'] == wf['id']);
      if (idx >= 0) _workflows[idx] = updated;
    } catch (e) {
      _showErrorDialog('Failed to rename: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteWorkflow(Map<String, dynamic> wf) async {
    final confirm = await showDialog<bool?>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete workflow'),
        content: Text('Delete "${wf['name']}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => _isLoading = true);
    try {
      await WorkflowService.deleteWorkflow(wf['id'] as int);
      _workflows.removeWhere((w) => w['id'] == wf['id']);
    } catch (e) {
      _showErrorDialog('Failed to delete: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _duplicateWorkflow(Map<String, dynamic> wf) async {
    final name = await _promptForName(context, 'Duplicate name', '${wf['name']} (copy)');
    if (name == null || name.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final newWf = await WorkflowService.createWorkflow(name);
      _workflows.insert(0, newWf);
    } catch (e) {
      _showErrorDialog('Failed to duplicate: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadNodesFromWorkflow(Map<String, dynamic> workflow) async {
    _rootNodes.clear();
    _nodeIdMapping.clear();
    final nodes = workflow['nodes'] as List<dynamic>;
    final connections = workflow['nodeConnections'] as List<dynamic>;
    final Map<int, WorkflowNode> nodeMap = {};
    for (var nodeJson in nodes) {
      final node = WorkflowNode.fromJson(nodeJson);
      nodeMap[nodeJson['id']] = node;
      _nodeIdMapping[node.id] = node.serverId!;
    }
    final Map<int, List<Map<String, dynamic>>> targetToSources = {};
    final Map<int, List<Map<String, dynamic>>> sourceToTargets = {};
    for (var connection in connections) {
      final sourceId = connection['sourceNodeId'] as int;
      final targetId = connection['targetNodeId'] as int;
      if (!targetToSources.containsKey(targetId)) {
        targetToSources[targetId] = [];
      }
      targetToSources[targetId]!.add(connection);
      if (!sourceToTargets.containsKey(sourceId)) {
        sourceToTargets[sourceId] = [];
      }
      sourceToTargets[sourceId]!.add(connection);
    }
    final Set<int> convergenceNodeIds = {};
    for (var entry in targetToSources.entries) {
      if (entry.value.length > 1) {
        convergenceNodeIds.add(entry.key);
      }
    }
    for (var connection in connections) {
      final sourceId = connection['sourceNodeId'] as int;
      final targetId = connection['targetNodeId'] as int;
      final channel = connection['channel'] as String?;
      final sourceNode = nodeMap[sourceId];
      final targetNode = nodeMap[targetId];
      if (sourceNode == null || targetNode == null) continue;
      if (convergenceNodeIds.contains(targetId)) {
        continue;
      }
      if (channel == 'next') {
        sourceNode.successNodes.add(targetNode);
      } else if (channel == 'failed') {
        sourceNode.failedNodes.add(targetNode);
      } else if (channel == 'source') {
        sourceNode.sourceNodes.add(targetNode);
      } else {
        sourceNode.successNodes.add(targetNode);
      }
    }
    for (var convergenceId in convergenceNodeIds) {
      final convergenceNode = nodeMap[convergenceId]!;
      final incomingConnections = targetToSources[convergenceId] ?? [];
      for (var connection in incomingConnections) {
        final directSourceId = connection['sourceNodeId'] as int;
        final directSourceNode = nodeMap[directSourceId];
        if (directSourceNode == null) continue;
        final chainRoot = _findChainRoot(
          directSourceId,
          targetToSources,
          convergenceNodeIds,
        );
        final chainRootNode = nodeMap[chainRoot];
        if (chainRootNode != null) {
          convergenceNode.sourceNodes.add(chainRootNode);
        }
      }
    }
    final Set<int> nonRootNodeIds = {};
    for (var connection in connections) {
      final targetId = connection['targetNodeId'] as int;
      if (!convergenceNodeIds.contains(targetId)) {
        nonRootNodeIds.add(targetId);
      }
    }
    for (var convergenceId in convergenceNodeIds) {
      final sources = targetToSources[convergenceId] ?? [];
      for (var connection in sources) {
        final sourceId = connection['sourceNodeId'] as int;
        final chainNodes = _getAllNodesInChain(
          sourceId,
          targetToSources,
          convergenceNodeIds,
        );
        nonRootNodeIds.addAll(chainNodes);
      }
    }
    setState(() {
      _rootNodes.addAll(nodeMap.values.where((node) =>
          convergenceNodeIds.contains(node.serverId) ||
          !nonRootNodeIds.contains(node.serverId)));
    });
  }

  int _findChainRoot(
    int nodeId,
    Map<int, List<Map<String, dynamic>>> targetToSources,
    Set<int> convergenceNodeIds,
  ) {
    final incoming = targetToSources[nodeId];
    if (incoming == null || incoming.isEmpty) {
      return nodeId;
    }
    if (convergenceNodeIds.contains(nodeId)) {
      return nodeId;
    }
    if (incoming.length == 1) {
      final parentId = incoming.first['sourceNodeId'] as int;
      return _findChainRoot(parentId, targetToSources, convergenceNodeIds);
    }
    return nodeId;
  }

  Set<int> _getAllNodesInChain(
    int nodeId,
    Map<int, List<Map<String, dynamic>>> targetToSources,
    Set<int> convergenceNodeIds,
  ) {
    final Set<int> chainNodes = {nodeId};
    int currentId = nodeId;
    while (true) {
      final incoming = targetToSources[currentId];
      if (incoming == null ||
          incoming.isEmpty ||
          convergenceNodeIds.contains(currentId)) {
        break;
      }
      if (incoming.length == 1) {
        final parentId = incoming.first['sourceNodeId'] as int;
        chainNodes.add(parentId);
        currentId = parentId;
      } else {
        break;
      }
    }
    return chainNodes;
  }

  @override
  void dispose() {
    _drawerController.dispose();
    super.dispose();
  }

  void _toggleDrawer() {
    setState(() {
      _isDrawerOpen = !_isDrawerOpen;
      if (_isDrawerOpen) {
        _drawerController.forward();
      } else {
        _drawerController.reverse();
      }
    });
  }

  WorkflowNode _createNode({
    LogicType? logicType,
    int? actionId,
    int? reactionId,
    String? name,
    String? description,
    Map<String, dynamic>? conf,
    double x = 0,
    double y = 0,
  }) {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    String nodeName;
    NodeType nodeType;
    if (logicType != null) {
      nodeType = NodeType.LOGIC;
      nodeName = logicType.toString().split('.').last;
    } else if (actionId != null) {
      nodeType = NodeType.ACTION;
      nodeName = name ?? 'Action $actionId';
    } else if (reactionId != null) {
      nodeType = NodeType.REACTION;
      nodeName = name ?? 'Reaction $reactionId';
    } else {
      nodeType = NodeType.LOGIC;
      nodeName = 'Unknown';
    }
    return WorkflowNode(
      id: id,
      name: nodeName,
      nodeType: nodeType,
      logicType: logicType,
      actionId: actionId,
      reactionId: reactionId,
      conf: conf ?? _getDefaultConf(logicType),
      positionX: x,
      positionY: y,
      isSynced: false,
    );
  }

  void _addRootNode(DragData data) {
    setState(() {
      final node = _createNode(
        logicType: data.logicType,
        actionId: data.actionId,
        reactionId: data.reactionId,
        name: data.name,
        description: data.description,
        conf: data.conf,
      );
      _rootNodes.add(node);
    });
  }

  Map<String, dynamic>? _getDefaultConf(LogicType? type) {
    if (type == null) return {};
    switch (type) {
      case LogicType.IF:
        return {'condition': '\${x} > 0'};
      case LogicType.AND:
      case LogicType.NOT:
        return {};
    }
  }

  void _removeNodeRecursive(String nodeId, List<WorkflowNode> nodes) {
    nodes.removeWhere((node) => node.id == nodeId);
    for (var node in nodes) {
      node.successNodes.removeWhere((child) => child.id == nodeId);
      node.failedNodes.removeWhere((child) => child.id == nodeId);
      node.sourceNodes.removeWhere((child) => child.id == nodeId);
      _removeNodeRecursive(nodeId, node.successNodes);
      _removeNodeRecursive(nodeId, node.failedNodes);
      _removeNodeRecursive(nodeId, node.sourceNodes);
    }
  }

  void _removeNode(String nodeId) {
    setState(() {
      final nodeToRemove = _findNode(nodeId, _rootNodes);
      if (nodeToRemove != null) {
        _collectNodeIdsForDeletion(nodeToRemove);
      }
      _removeNodeRecursive(nodeId, _rootNodes);
    });
  }

  void _collectNodeIdsForDeletion(WorkflowNode node) {
    if (node.serverId != null &&
        !_deletedNodeServerIds.contains(node.serverId)) {
      _deletedNodeServerIds.add(node.serverId!);
    }
    for (var child in node.successNodes) {
      _collectNodeIdsForDeletion(child);
    }
    for (var child in node.failedNodes) {
      _collectNodeIdsForDeletion(child);
    }
    for (var child in node.sourceNodes) {
      _collectNodeIdsForDeletion(child);
    }
  }

  void _handleNodeDropped(WorkflowNode node, String channel, DragData data) {
    setState(() {
      if (data.isNewNode) {
        final newNode = _createNode(
          logicType: data.logicType,
          actionId: data.actionId,
          reactionId: data.reactionId,
          name: data.name,
          description: data.description,
          conf: data.conf,
        );
        if (channel == 'success') {
          node.successNodes.add(newNode);
        } else if (channel == 'failed') {
          node.failedNodes.add(newNode);
        } else if (channel == 'source') {
          node.sourceNodes.add(newNode);
        }
      } else if (data.isExistingNode && data.nodeId != null) {
        final movedNode = _findAndRemoveNode(data.nodeId!);
        if (movedNode != null) {
          if (channel == 'success') {
            node.successNodes.add(movedNode);
          } else if (channel == 'failed') {
            node.failedNodes.add(movedNode);
          } else if (channel == 'source') {
            node.sourceNodes.add(movedNode);
          }
        }
      }
    });
  }

  WorkflowNode? _findNode(String nodeId, List<WorkflowNode> nodes) {
    for (var node in nodes) {
      if (node.id == nodeId) return node;
      var found = _findNode(nodeId, node.successNodes);
      if (found != null) return found;
      found = _findNode(nodeId, node.failedNodes);
      if (found != null) return found;
      found = _findNode(nodeId, node.sourceNodes);
      if (found != null) return found;
    }
    return null;
  }

  void _handleConditionChanged(WorkflowNode node, String newCondition) {
    setState(() {
      node.conf = {'condition': newCondition};
    });
  }

  WorkflowNode _findHeadNode(WorkflowNode node) {
    if (node.successNodes.isEmpty) {
      return node;
    }
    return _findHeadNode(node.successNodes.first);
  }

  void _collectAllNodes(List<WorkflowNode> nodes, List<WorkflowNode> result) {
    for (var node in nodes) {
      if (!result.any((n) => n.id == node.id)) {
        result.add(node);
        _collectAllNodes(node.successNodes, result);
        _collectAllNodes(node.failedNodes, result);
        _collectAllNodes(node.sourceNodes, result);
      }
    }
  }

  WorkflowNode? _findAndRemoveNode(String nodeId) {
    for (int i = 0; i < _rootNodes.length; i++) {
      if (_rootNodes[i].id == nodeId) {
        return _rootNodes.removeAt(i);
      }
    }
    return _findAndRemoveNodeRecursive(nodeId, _rootNodes);
  }

  WorkflowNode? _findAndRemoveNodeRecursive(
      String nodeId, List<WorkflowNode> nodes) {
    for (var node in nodes) {
      for (int i = 0; i < node.successNodes.length; i++) {
        if (node.successNodes[i].id == nodeId) {
          return node.successNodes.removeAt(i);
        }
      }
      for (int i = 0; i < node.failedNodes.length; i++) {
        if (node.failedNodes[i].id == nodeId) {
          return node.failedNodes.removeAt(i);
        }
      }
      for (int i = 0; i < node.sourceNodes.length; i++) {
        if (node.sourceNodes[i].id == nodeId) {
          return node.sourceNodes.removeAt(i);
        }
      }
      final found = _findAndRemoveNodeRecursive(nodeId, node.successNodes);
      if (found != null) return found;
      final found2 = _findAndRemoveNodeRecursive(nodeId, node.failedNodes);
      if (found2 != null) return found2;
      final found3 = _findAndRemoveNodeRecursive(nodeId, node.sourceNodes);
      if (found3 != null) return found3;
    }
    return null;
  }

  Future<void> _saveWorkflow() async {
    if (_currentWorkflowId == null) {
      _showErrorDialog('No workflow loaded');
      return;
    }
    try {
      setState(() => _isSaving = true);
      final allNodes = <WorkflowNode>[];
      _collectAllNodes(_rootNodes, allNodes);
      for (var node in allNodes) {
        if (node.serverId != null) {
          try {
            await WorkflowService.deleteNode(
              workflowId: _currentWorkflowId!,
              nodeId: node.serverId!,
            );
          } catch (e) {
            print('Error deleting node ${node.serverId}: $e');
          }
        }
      }
      for (var serverId in _deletedNodeServerIds) {
        try {
          await WorkflowService.deleteNode(
            workflowId: _currentWorkflowId!,
            nodeId: serverId,
          );
        } catch (e) {
          print('Error deleting node $serverId: $e');
        }
      }
      _deletedNodeServerIds.clear();
      allNodes.clear();
      _collectAllNodes(_rootNodes, allNodes);
      _nodeIdMapping.clear();
      for (var node in allNodes) {
        node.serverId = null;
        node.isSynced = false;
      }
      for (var node in allNodes) {
        String? logicTypeForApi;
        int? actionIdForApi;
        int? reactionIdForApi;
        switch (node.nodeType) {
          case NodeType.LOGIC:
            logicTypeForApi = node.logicType?.toString().split('.').last;
            break;
          case NodeType.ACTION:
            actionIdForApi = node.actionId;
            break;
          case NodeType.REACTION:
            reactionIdForApi = node.reactionId;
            break;
        }
        try {
          print('DEBUG: creating node payload name=${node.name} type=${node.nodeType} actionId=$actionIdForApi reactionId=$reactionIdForApi conf=${node.conf}');
        } catch (_) {}
        final response = await WorkflowService.createNode(
          workflowId: _currentWorkflowId!,
          name: node.name,
          logicType: logicTypeForApi,
          actionId: actionIdForApi,
          reactionId: reactionIdForApi,
          conf: node.conf ?? {},
          positionX: node.positionX,
          positionY: node.positionY,
        );
        try {
          print('DEBUG: created node server response for local ${node.id} => ${response}');
        } catch (_) {}
        final serverId = response['id'] as int;
        _nodeIdMapping[node.id] = serverId;
        node.serverId = serverId;
        node.isSynced = true;
      }
      for (var node in allNodes) {
        final sourceServerId = _nodeIdMapping[node.id] ?? node.serverId;
        if (sourceServerId == null) continue;
        for (var successNode in node.successNodes) {
          final targetServerId =
              _nodeIdMapping[successNode.id] ?? successNode.serverId;
          if (targetServerId != null) {
            await WorkflowService.createConnection(
              workflowId: _currentWorkflowId!,
              sourceNodeId: sourceServerId,
              targetNodeId: targetServerId,
            );
          }
        }
        for (var failedNode in node.failedNodes) {
          final targetServerId =
              _nodeIdMapping[failedNode.id] ?? failedNode.serverId;
          if (targetServerId != null) {
            await WorkflowService.createConnection(
              workflowId: _currentWorkflowId!,
              sourceNodeId: sourceServerId,
              targetNodeId: targetServerId,
            );
          }
        }
        for (var sourceNode in node.sourceNodes) {
          final leafNode = _findHeadNode(sourceNode);
          final leafServerId = _nodeIdMapping[leafNode.id] ?? leafNode.serverId;
          if (leafServerId != null) {
            await WorkflowService.createConnection(
              workflowId: _currentWorkflowId!,
              sourceNodeId: leafServerId,
              targetNodeId: sourceServerId,
            );
          }
        }
      }
      setState(() => _isSaving = false);
      _showSuccessDialog('Workflow saved successfully!');
    } catch (e) {
      setState(() => _isSaving = false);
      _showErrorDialog('Failed to save workflow: $e');
    }
  }

  void _showErrorDialog(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessDialog(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  Widget _buildNodeCard(WorkflowNode node, int depth) {
    return WorkflowNodeCard(
      node: node,
      depth: depth,
      onRemoveNode: _removeNode,
      onNodeDropped: _handleNodeDropped,
      buildNodeCard: _buildNodeCard,
      onConditionChanged: _handleConditionChanged,
      onEditNode: _showEditNodeConfig,
    );
  }

  Future<void> _showEditNodeConfig(WorkflowNode node) async {
  Map<String, dynamic>? foundItem;
    final idToFind = node.actionId ?? node.reactionId;
    final isAction = node.nodeType == NodeType.ACTION;
    if (idToFind != null) {
      for (var svc in _services) {
        try {
          final actions = svc['actions'] as List<dynamic>?;
          final reactions = svc['reactions'] as List<dynamic>?;
          if (isAction && actions != null) {
            final it = actions.firstWhere((a) => (a['id'] == idToFind) || (a['id']?.toString() == idToFind.toString()), orElse: () => null);
            if (it != null) {
              foundItem = Map<String, dynamic>.from(it as Map);
              break;
            }
          }
          if (!isAction && reactions != null) {
            final it = reactions.firstWhere((r) => (r['id'] == idToFind) || (r['id']?.toString() == idToFind.toString()), orElse: () => null);
            if (it != null) {
              foundItem = Map<String, dynamic>.from(it as Map);
              break;
            }
          }
        } catch (_) {}
      }
    }

  final rawInputs = foundItem != null
    ? (foundItem['inputs'] ?? foundItem['parameters'] ?? foundItem['parametersList'] ?? [])
    : [];
  List<Map<String, dynamic>> inputs = List<Map<String, dynamic>>.from((rawInputs as List<dynamic>?)?.map((e) => Map<String, dynamic>.from(e as Map)) ?? []);

  final initialConf = node.conf ?? {};
  if ((initialConf.isEmpty) && inputs.isNotEmpty) {
    final Map<String, dynamic> defaultConf = {};
    for (var input in inputs) {
      // prefer an explicit API key when available
      final pkey = input['key']?.toString() ?? input['name']?.toString() ?? '';
      final ptype = (input['type'] ?? 'string').toString();
      final pdefault = input['default'];
      if (pdefault != null) {
        defaultConf[pkey] = pdefault;
      } else if (ptype == 'boolean') {
        defaultConf[pkey] = false;
      } else if (ptype == 'number') {
        defaultConf[pkey] = null;
      } else {
        defaultConf[pkey] = '';
      }
    }
    node.conf = defaultConf;
  }

  if (inputs.isEmpty && (node.conf ?? {}).isNotEmpty) {
    final derived = <Map<String, dynamic>>[];
    (node.conf ?? {}).forEach((k, v) {
      final inferredType = (v is bool)
          ? 'boolean'
          : (v is num)
              ? 'number'
              : 'string';
      // ensure derived inputs have both a display name and a key
      derived.add({'key': k, 'name': k, 'type': inferredType, 'description': ''});
    });
    inputs.addAll(derived);
  }

  try {
    print('DEBUG: showEditNodeConfig node=${node.id} actionId=${node.actionId} reactionId=${node.reactionId} foundItemId=${foundItem?['id'] ?? 'null'} inputs=${inputs.map((i) => i['name']).toList()} node.conf=${node.conf}');
  } catch (_) {}

  final controllers = <String, TextEditingController>{};
  final switches = <String, bool>{};
  final selects = <String, String>{};
  final usedConf = node.conf ?? {};
  for (var input in inputs) {
    final apiKey = input['key']?.toString() ?? input['name']?.toString() ?? '';
    final label = input['name']?.toString() ?? apiKey;
    final type = (input['type'] ?? 'string').toString();
    // support existing confs that may have used label as key previously
    final initial = usedConf[apiKey] ?? usedConf[label];
    if (type == 'boolean') {
      switches[apiKey] = (initial is bool) ? initial : (input['default'] == true);
    } else {
      controllers[apiKey] = TextEditingController(text: initial != null ? initial.toString() : (input['default']?.toString() ?? ''));
      if (input['type'] == 'select' && input['options'] is List) {
        if (initial != null)
          selects[apiKey] = initial.toString();
        else if ((input['options'] as List).isNotEmpty)
          selects[apiKey] = (input['options'] as List).first.toString();
      }
    }
    // store normalized keys/labels for UI rendering
    input['__apiKey'] = apiKey;
    input['__label'] = label;
  }

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('${isAction ? 'Action' : 'Reaction'} Parameters'),
          content: SizedBox(
            width: double.maxFinite,
            child: inputs.isEmpty
                ? const Text('No configurable parameters for this node.')
                : SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: inputs.map((input) {
                        final apiKey = input['__apiKey'] ?? input['key']?.toString() ?? input['name']?.toString() ?? '';
                        final name = input['__label'] ?? input['name']?.toString() ?? apiKey;
                        final type = (input['type'] ?? 'string').toString();
                        final description = input['description']?.toString() ?? '';
                        if (type == 'boolean') {
                          return StatefulBuilder(builder: (c, setStateSB) {
                            return SwitchListTile(
                              title: Text(name),
                              subtitle: description.isNotEmpty ? Text(description) : null,
                              value: switches[apiKey] ?? false,
                              onChanged: (v) {
                                setStateSB(() {
                                  switches[apiKey] = v;
                                });
                              },
                            );
                          });
                        } else if (type == 'select' && input['options'] is List) {
                          final options = List<dynamic>.from(input['options'] as List);
                          return StatefulBuilder(builder: (c, setStateSB) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  value: selects[apiKey] ?? (options.isNotEmpty ? options.first.toString() : null),
                                  items: options.map((o) => DropdownMenuItem(value: o.toString(), child: Text(o.toString()))).toList(),
                                  onChanged: (v) {
                                    setStateSB(() {
                                      selects[apiKey] = v ?? '';
                                    });
                                  },
                                ),
                                if (description.isNotEmpty) Text(description, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                                const SizedBox(height: 8),
                              ],
                            );
                          });
                        } else if (type == 'text') {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: controllers[apiKey],
                                maxLines: 4,
                                decoration: InputDecoration(hintText: description),
                              ),
                              const SizedBox(height: 8),
                            ],
                          );
                        } else {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: controllers[apiKey],
                                decoration: InputDecoration(hintText: description),
                              ),
                              const SizedBox(height: 8),
                            ],
                          );
                        }
                      }).toList(),
                    ),
                  ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                final Map<String, dynamic> newConf = {};
                for (var input in inputs) {
                  final apiKey = input['__apiKey'] ?? input['key']?.toString() ?? input['name']?.toString() ?? '';
                  final type = (input['type'] ?? 'string').toString();
                  if (type == 'boolean') {
                    newConf[apiKey] = switches[apiKey] ?? false;
                  } else if (type == 'number') {
                    final text = controllers[apiKey]?.text ?? '';
                    newConf[apiKey] = num.tryParse(text) ?? text;
                  } else {
                    if (input['type'] == 'select') {
                      newConf[apiKey] = selects[apiKey] ?? controllers[apiKey]?.text ?? '';
                    } else {
                      newConf[apiKey] = controllers[apiKey]?.text ?? '';
                    }
                  }
                }
                node.conf = newConf;
                try { print('DEBUG: saved conf for node ${node.id}: ${node.conf}'); } catch (_) {}
                Navigator.of(ctx).pop(true);
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );

    if (saved == true) {
      setState(() {});
      if (node.serverId != null && _currentWorkflowId != null) {
        try {
          await WorkflowService.updateNode(
            workflowId: _currentWorkflowId!,
            nodeId: node.serverId!,
            name: node.name,
            logicType: node.logicType?.toString().split('.').last ?? '',
            conf: node.conf ?? {},
            positionX: node.positionX,
            positionY: node.positionY,
          );
          _showSuccessDialog('Node saved');
        } catch (e) {
          _showErrorDialog('Failed to update node: $e');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            _isDrawerOpen ? Icons.close : Icons.menu,
            color: const Color(0xFF0F172A),
          ),
          onPressed: _toggleDrawer,
        ),
        title: Column(
          children: [
            const Text(
              'Workflow',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Create and connect your services.',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
                fontWeight: FontWeight.normal,
              ),
            )
          ],
        ),
        centerTitle: true,
        actions: [
          if (!_isLoading) ...[
            if (!_isListing)
              Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: TextButton.icon(
                  onPressed: () {
                    // go back to listing
                    setState(() {
                      _isListing = true;
                      _currentWorkflowId = null;
                      _rootNodes.clear();
                    });
                    _loadWorkflow();
                  },
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Workflows'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF0F172A),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: TextButton.icon(
                onPressed: _isSaving ? null : _saveWorkflow,
                icon: _isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save),
                label: Text(_isSaving ? 'Saving...' : 'Save'),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF0F172A),
                ),
              ),
            ),
          ],
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            color: const Color(0xFFE5E7EB),
            height: 1,
          ),
        ),
        toolbarHeight: 80,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : (_isListing
              ? Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('My Workflows', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                          ElevatedButton.icon(
                            onPressed: _createAndOpenWorkflow,
                            icon: const Icon(Icons.add),
                            label: const Text('New'),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _workflows.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final wf = _workflows[index];
                          return ListTile(
                            tileColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: BorderSide(color: Colors.grey[200]!)),
                            title: Text(wf['name'] ?? 'Untitled'),
                            subtitle: Text('ID: ${wf['id'] ?? '-'}'),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.open_in_new),
                                  onPressed: () => _openWorkflow(wf),
                                ),
                                PopupMenuButton<String>(
                                  onSelected: (v) async {
                                    if (v == 'rename') await _renameWorkflow(wf);
                                    if (v == 'delete') await _deleteWorkflow(wf);
                                    if (v == 'duplicate') await _duplicateWorkflow(wf);
                                  },
                                  itemBuilder: (ctx) => [
                                    const PopupMenuItem(value: 'rename', child: Text('Rename')),
                                    const PopupMenuItem(value: 'duplicate', child: Text('Duplicate')),
                                    const PopupMenuItem(value: 'delete', child: Text('Delete')),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    BottomNavBar(activeIndex: 1),
                  ],
                )
              : Stack(
                  children: [
                    Column(
                      children: [
                        Expanded(
                          child: DragTarget<DragData>(
                            onWillAccept: (data) => data?.isNewNode ?? false,
                            onAccept: (data) {
                              _addRootNode(data);
                              if (_isDrawerOpen) _toggleDrawer();
                            },
                            builder: (context, candidateData, rejectedData) {
                              return _rootNodes.isEmpty
                                  ? Center(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.account_tree_outlined,
                                            size: 64,
                                            color: candidateData.isNotEmpty
                                                ? Colors.blue[300]
                                                : Colors.grey[300],
                                          ),
                                          const SizedBox(height: 16),
                                          Text(
                                            candidateData.isNotEmpty
                                                ? 'Drop here to add node'
                                                : 'Drag nodes here to start',
                                            style: TextStyle(
                                              fontSize: 16,
                                              color: candidateData.isNotEmpty
                                                  ? Colors.blue[600]
                                                  : Colors.grey[500],
                                              fontWeight: candidateData.isNotEmpty
                                                  ? FontWeight.w600
                                                  : FontWeight.normal,
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  : ListView.builder(
                                      padding: const EdgeInsets.all(16),
                                      itemCount: _rootNodes.length,
                                      itemBuilder: (context, index) {
                                        return _buildNodeCard(_rootNodes[index], 0);
                                      },
                                    );
                            },
                          ),
                        ),
                        BottomNavBar(
                          activeIndex: 1,
                        ),
                      ],
                    ),
                    NodeDrawer(animation: _drawerAnimation),
                  ],
                )),
    );
  }
}
