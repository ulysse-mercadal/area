import 'package:flutter/material.dart';
import '../models/workflow_node.dart';
import '../models/drag_data.dart';

class ChannelDropZone extends StatelessWidget {
  final WorkflowNode node;
  final String channel;
  final String title;
  final IconData icon;
  final Color color;
  final List<WorkflowNode> childNodes;
  final int depth;
  final Function(WorkflowNode, String, DragData) onNodeDropped;
  final Function(WorkflowNode, int) buildNodeCard;

  const ChannelDropZone({
    Key? key,
    required this.node,
    required this.channel,
    required this.title,
    required this.icon,
    required this.color,
    required this.childNodes,
    required this.depth,
    required this.onNodeDropped,
    required this.buildNodeCard,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color darkColor = Color.lerp(color, Colors.black, 0.3)!;

    return DragTarget<DragData>(
      onWillAccept: (data) {
        if (data == null) return false;
        if (data.isNewNode) return true;
        if (data.isExistingNode) return data.nodeId != node.id;
        return false;
      },
      onAccept: (data) => onNodeDropped(node, channel, data),
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color:
                isHovering ? color.withOpacity(0.15) : color.withOpacity(0.05),
            border: isHovering ? Border.all(color: color, width: 2) : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    icon,
                    color: color,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      color: darkColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  if (isHovering)
                    Icon(
                      Icons.add_circle_outline,
                      color: color,
                      size: 18,
                    ),
                ],
              ),
              if (childNodes.isNotEmpty) ...[
                const SizedBox(height: 8),
                ...childNodes.map((childNode) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Draggable<DragData>(
                      data: DragData.existingNode(childNode.id),
                      feedback: Material(
                        elevation: 8,
                        child: Opacity(
                          opacity: 0.8,
                          child: SizedBox(
                            width: 300,
                            child: buildNodeCard(childNode, 0),
                          ),
                        ),
                      ),
                      childWhenDragging: Opacity(
                        opacity: 0.3,
                        child: buildNodeCard(childNode, depth + 1),
                      ),
                      child: buildNodeCard(childNode, depth + 1),
                    ),
                  );
                }).toList(),
              ] else if (!isHovering) ...[
                const SizedBox(height: 4),
                Text(
                  'Drop nodes here',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
