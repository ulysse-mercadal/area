enum LogicType { IF, AND, NOT }

enum NodeType { LOGIC, ACTION, REACTION }

class WorkflowNode {
  String id;
  int? serverId;
  String name;
  NodeType nodeType;
  LogicType? logicType;
  int? actionId;
  int? reactionId;
  Map<String, dynamic>? conf;
  double positionX;
  double positionY;
  bool isSynced;
  final List<WorkflowNode> successNodes = [];
  final List<WorkflowNode> failedNodes = [];
  final List<WorkflowNode> sourceNodes = [];

  WorkflowNode({
    required this.id,
    this.serverId,
    required this.name,
    required this.nodeType,
    this.logicType,
    this.actionId,
    this.reactionId,
    this.conf,
    this.positionX = 0.0,
    this.positionY = 0.0,
    this.isSynced = false,
  });

  factory WorkflowNode.fromJson(Map<String, dynamic> json) {
    final logicTypeStr = json['logicType'] as String?;
    LogicType? logicType;
    if (logicTypeStr != null) {
      logicType = LogicType.values.firstWhere(
        (e) => e.toString().split('.').last == logicTypeStr,
        orElse: () => LogicType.IF,
      );
    }
    NodeType nodeType;
    if (logicType != null) {
      nodeType = NodeType.LOGIC;
    } else if (json['actionId'] != null) {
      nodeType = NodeType.ACTION;
    } else if (json['reactionId'] != null) {
      nodeType = NodeType.REACTION;
    } else {
      nodeType = NodeType.LOGIC;
    }

    return WorkflowNode(
      id: json['id'].toString(),
      serverId: json['id'] as int?,
      name: json['name'] as String,
      nodeType: nodeType,
      logicType: logicType,
      actionId: json['actionId'] as int?,
      reactionId: json['reactionId'] as int?,
      conf: json['conf'] as Map<String, dynamic>?,
      positionX: (json['positionX'] as num?)?.toDouble() ?? 0.0,
      positionY: (json['positionY'] as num?)?.toDouble() ?? 0.0,
      isSynced: true,
    );
  }

  Map<String, dynamic> toJsonForApi() {
    final json = <String, dynamic>{
      'name': name,
      'conf': conf ?? {},
      'positionX': positionX,
      'positionY': positionY,
    };
    if (nodeType == NodeType.LOGIC && logicType != null) {
      json['logicType'] = logicType.toString().split('.').last;
    }
    return json;
  }
}
