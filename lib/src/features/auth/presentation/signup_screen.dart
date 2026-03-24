import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ui_primitives.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign Up')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          TextField(
            decoration: const InputDecoration(hintText: 'Full Name', border: InputBorder.none),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            decoration: const InputDecoration(hintText: 'Email', border: InputBorder.none),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            obscureText: true,
            decoration: const InputDecoration(hintText: 'Password', border: InputBorder.none),
          ),
          const SizedBox(height: AppSpacing.xl),
          PrimaryButton(
            label: 'Create Account',
            onPressed: () => context.go('/dashboard'),
          ),
        ],
      ),
    );
  }
}
