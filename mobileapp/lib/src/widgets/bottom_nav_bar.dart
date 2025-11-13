import 'package:flutter/material.dart';
import '../app_theme.dart';

class BottomNavBar extends StatelessWidget {
  final int activeIndex;

  const BottomNavBar({Key? key, required this.activeIndex}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey[200]!, width: 1),
        ),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 80,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(
                icon: Icons.key,
                label: 'Credentials',
                isActive: activeIndex == 0,
                onTap: () => Navigator.pushNamed(context, '/credentials'),
              ),
              _NavItem(
                icon: Icons.account_tree_outlined,
                label: 'Workflow',
                isActive: activeIndex == 1,
                onTap: () => Navigator.pushNamed(context, '/workflow'),
              ),
              _NavItem(
                icon: Icons.account_circle_outlined,
                label: 'Account',
                isActive: activeIndex == 2,
                onTap: () => Navigator.pushNamed(context, '/account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({Key? key, required this.icon, required this.label, required this.isActive, required this.onTap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 28,
            color: isActive ? AppTheme.primary : Colors.grey[400],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isActive ? AppTheme.primary : Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }
}
