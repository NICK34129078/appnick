import 'package:facetrack_ai/src/features/onboarding/presentation/onboarding_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('onboarding renders CTA', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: OnboardingScreen()));

    expect(find.text('FaceTrack AI'), findsOneWidget);
    expect(find.text('Get Started'), findsOneWidget);
  });
}
