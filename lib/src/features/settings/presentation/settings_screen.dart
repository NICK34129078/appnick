import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ui_primitives.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: const [
          _Item(title: 'Notifications', subtitle: 'Weekly reminders', icon: Icons.notifications_none),
          ThinDivider(),
          _Item(title: 'Privacy & GDPR', subtitle: 'Consent and data controls', icon: Icons.privacy_tip_outlined),
          ThinDivider(),
          _Item(title: 'Delete my data', subtitle: 'Remove account and scan history', icon: Icons.delete_outline),
          ThinDivider(),
          _Item(title: 'About', subtitle: 'Version and legal', icon: Icons.info_outline),
        ],
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({required this.title, required this.subtitle, required this.icon});

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.xs),
      leading: Icon(icon, color: const Color(0xFF8D8D93)),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right, color: Color(0xFF8D8D93)),
    );
  }
}
