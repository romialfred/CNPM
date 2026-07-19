import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/app_composition.dart';
import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/app/app_router.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

class CnpmApp extends StatefulWidget {
  const CnpmApp({required this.config, super.key});

  final AppConfig config;

  @override
  State<CnpmApp> createState() => _CnpmAppState();
}

class _CnpmAppState extends State<CnpmApp> {
  late final AppComposition _composition;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _composition = AppComposition.create(widget.config);
    _router = buildAppRouter(
      config: widget.config,
      authController: _composition.authController,
      contributionController: _composition.contributionController,
      loadMemberContribution: _composition.loadMemberContribution,
      dashboardController: _composition.dashboardController,
      documentController: _composition.documentController,
      notificationController: _composition.notificationController,
      paymentController: _composition.paymentController,
      receiptController: _composition.receiptController,
      loadMemberReceipt: _composition.loadMemberReceipt,
      requestController: _composition.requestController,
      loadMemberRequest: _composition.loadMemberRequest,
      createMemberRequest: _composition.createMemberRequest,
      addSharedRequestMessage: _composition.addSharedRequestMessage,
      onSignOut: _composition.signOut,
    );
  }

  @override
  void dispose() {
    _router.dispose();
    _composition.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'CNPM',
      debugShowCheckedModeBanner: false,
      theme: buildCnpmTheme(),
      themeAnimationDuration: Duration.zero,
      routerConfig: _router,
      builder: (context, child) {
        return RepaintBoundary(
          key: const Key('app-surface'),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
