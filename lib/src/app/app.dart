import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import 'router/app_router.dart';

class FaceTrackApp extends StatelessWidget {
  const FaceTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = buildRouter();
    return MaterialApp.router(
      title: 'FaceTrack AI',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.light,
      theme: buildAppTheme(),
      darkTheme: buildAppTheme(),
      routerConfig: router,
    );
  }
}
