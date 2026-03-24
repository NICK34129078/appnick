import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ui_primitives.dart';

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Results')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text('78%', style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: AppSpacing.xs),
          Text('Overall Face Score', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: AppSpacing.xl),
          const _MetricBar(label: 'Hydration', value: 0.82),
          const SizedBox(height: AppSpacing.md),
          const _MetricBar(label: 'Texture', value: 0.74),
          const SizedBox(height: AppSpacing.md),
          const _MetricBar(label: 'Tone', value: 0.79),
          const SizedBox(height: AppSpacing.xl),
          const PremiumCard(
            child: Text(
              'Skin shows positive recovery trend. Continue with hydration and sun protection.',
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricBar extends StatelessWidget {
  const _MetricBar({required this.label, required this.value});

  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: AppSpacing.xs),
        ClipRRect(
          borderRadius: AppRadius.pill,
          child: LinearProgressIndicator(
            value: value,
            minHeight: 10,
            backgroundColor: AppColors.secondarySurface,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accentBlue),
          ),
        ),
      ],
    );
  }
}
