import 'workflow_node.dart';

class DragData {
  final LogicType? logicType;
  final int? actionId;
  final int? reactionId;
  final String? nodeId;
  final String? name;
  final String? description;
  final Map<String, dynamic>? conf;

  DragData.newNode({
    required this.logicType,
    required this.actionId,
    required this.reactionId,
    this.name,
    this.description,
    this.conf,
  }) : nodeId = null;

  DragData.existingNode(this.nodeId)
      : logicType = null,
        actionId = null,
        reactionId = null,
        name = null,
        description = null,
        conf = null;
  bool get isNewNode => nodeId == null;
  bool get isExistingNode => nodeId != null;
  bool get isLogicNode => logicType != null;
  bool get isActionNode => actionId != null;
  bool get isReactionNode => reactionId != null;
}
