import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ui_primitives.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          const SizedBox(height: AppSpacing.lg),
          TextField(
            decoration: const InputDecoration(
              hintText: 'Email',
              border: InputBorder.none,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            obscureText: true,
            decoration: const InputDecoration(
              hintText: 'Password',
              border: InputBorder.none,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          PrimaryButton(
            label: 'Login',
            onPressed: () => context.go('/dashboard'),
          ),
          const SizedBox(height: AppSpacing.md),
          TextButton(
            onPressed: () => context.push('/signup'),
            child: const Text('Create an account'),
          ),
        ],
      ),
    );
  }
}
