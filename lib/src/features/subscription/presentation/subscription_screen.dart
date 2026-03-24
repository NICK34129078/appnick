import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ui_primitives.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FaceTrack Premium')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text('Upgrade to Premium', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Get AI chat, unlimited analysis, and weekly personalized guidance.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: AppSpacing.xl),
          const PremiumCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('1 month free', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                SizedBox(height: AppSpacing.xs),
                Text('Then €9.99/month', style: TextStyle(fontSize: 16)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          PrimaryButton(label: 'Start Free Trial', onPressed: _noop),
        ],
      ),
    );
  }
}

void _noop() {}
