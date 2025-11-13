import 'package:flutter/material.dart';
import '../models/workflow_node.dart';
import '../models/drag_data.dart';
import 'channel_drop_zone.dart';
import 'edit_condition_dialog.dart';

class WorkflowNodeCard extends StatelessWidget {
  final WorkflowNode node;
  final int depth;
  final Function(String) onRemoveNode;
  final Function(WorkflowNode, String, DragData) onNodeDropped;
  final Function(WorkflowNode, int) buildNodeCard;
  final Function(WorkflowNode, String)? onConditionChanged;
  final Function(WorkflowNode)? onEditNode; // open parameter editor for action/reaction nodes
  const WorkflowNodeCard({
    Key? key,
    required this.node,
    required this.depth,
    required this.onRemoveNode,
    required this.onNodeDropped,
    required this.buildNodeCard,
    this.onConditionChanged,
    this.onEditNode,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    String displayName;
    switch (node.nodeType) {
      case NodeType.LOGIC:
        color = Colors.blue;
        switch (node.logicType) {
          case LogicType.IF:
            icon = Icons.call_split;
            displayName = 'IF Node';
            break;
          case LogicType.AND:
            icon = Icons.merge_type;
            displayName = 'AND Node';
            break;
          case LogicType.NOT:
            icon = Icons.swap_horiz;
            displayName = 'NOT Node';
            break;
          default:
            icon = Icons.device_hub;
            displayName = 'Logic Node';
        }
        break;
      case NodeType.ACTION:
        color = Colors.green;
        icon = Icons.play_arrow;
        displayName = node.name;
        break;
      case NodeType.REACTION:
        color = Colors.orange;
        icon = Icons.settings;
        displayName = node.name;
        break;
    }
  return LongPressDraggable<DragData>(
      data: DragData.existingNode(node.id),
      feedback: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        child: Opacity(
          opacity: 0.8,
          child: Container(
            width: 300,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color, width: 2),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 16),
                Text(
                  displayName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      childWhenDragging: Opacity(
        opacity: 0.3,
        child: _buildCard(context, color, icon, displayName),
      ),
      child: _buildCard(context, color, icon, displayName),
    );
  }

  Widget _buildCard(BuildContext context, Color color, IconData icon, String displayName) {
    return Container(
      margin: EdgeInsets.only(
        bottom: 16,
        left: 4,
      ),
        child: Material(
        elevation: 2,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: () {
            if (node.nodeType == NodeType.LOGIC && node.logicType == LogicType.IF) {
              _showEditDialog(context);
            } else if ((node.nodeType == NodeType.ACTION || node.nodeType == NodeType.REACTION) && onEditNode != null) {
              onEditNode!(node);
            }
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color, width: 2),
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(icon, color: color, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  displayName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                            if (node.nodeType == NodeType.LOGIC &&
                                node.logicType == LogicType.IF &&
                                node.conf != null &&
                                node.conf!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: color.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Text(
                                    node.conf!['condition']?.toString() ?? '',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[800],
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ),
                              ),
                            if (node.nodeType == NodeType.ACTION && node.actionId != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  '${node.actionId}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ),
                            if (node.nodeType == NodeType.REACTION && node.reactionId != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  'Reaction ID: ${node.reactionId}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline),
                        color: Colors.red[300],
                        onPressed: () => onRemoveNode(node.id),
                      ),
                    ],
                  ),
                ),
                if (node.nodeType == NodeType.LOGIC)
                  Container(
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(color: Colors.grey[200]!),
                      ),
                    ),
                    child: Column(
                      children: [
                        ChannelDropZone(
                          node: node,
                          channel: 'source',
                          title: 'Source',
                          icon: Icons.input_outlined,
                          color: Colors.blue,
                          childNodes: node.sourceNodes,
                          depth: depth,
                          onNodeDropped: onNodeDropped,
                          buildNodeCard: buildNodeCard,
                        ),
                        Container(
                          height: 1,
                          color: Colors.grey[200],
                        ),
                        ChannelDropZone(
                          node: node,
                          channel: 'success',
                          title: 'Success',
                          icon: Icons.check_circle_outline,
                          color: Colors.green,
                          childNodes: node.successNodes,
                          depth: depth,
                          onNodeDropped: onNodeDropped,
                          buildNodeCard: buildNodeCard,
                        ),
                        Container(
                          height: 1,
                          color: Colors.grey[200],
                        ),
                        ChannelDropZone(
                          node: node,
                          channel: 'failed',
                          title: 'Failed',
                          icon: Icons.cancel_outlined,
                          color: Colors.red,
                          childNodes: node.failedNodes,
                          depth: depth,
                          onNodeDropped: onNodeDropped,
                          buildNodeCard: buildNodeCard,
                        ),
                      ],
                    ),
                  ),
                if (node.nodeType != NodeType.LOGIC)
                  Container(
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(color: Colors.grey[200]!),
                      ),
                    ),
                    child: ChannelDropZone(
                      node: node,
                      channel: 'success',
                      title: 'Next',
                      icon: Icons.arrow_forward,
                      color: color,
                      childNodes: node.successNodes,
                      depth: depth,
                      onNodeDropped: onNodeDropped,
                      buildNodeCard: buildNodeCard,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showEditDialog(BuildContext context) async {
    if (node.nodeType == NodeType.LOGIC && node.logicType == LogicType.IF) {
      final currentCondition = node.conf?['condition']?.toString() ?? '\${x} > 0';
      final result = await showDialog<String>(
        context: context,
        builder: (context) => EditConditionDialog(
          currentCondition: currentCondition,
        ),
      );
      if (result != null && result.isNotEmpty && onConditionChanged != null) {
        onConditionChanged!(node, result);
      }
    }
  }
}
