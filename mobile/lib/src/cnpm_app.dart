import 'package:flutter/material.dart';

import '../design_system/cnpm_theme.dart';

class CnpmApp extends StatelessWidget {
  const CnpmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CNPM',
      debugShowCheckedModeBanner: false,
      theme: buildCnpmTheme(),
      home: const _ProjectReadyPage(),
    );
  }
}

class _ProjectReadyPage extends StatelessWidget {
  const _ProjectReadyPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('CNPM Digital Platform')),
      body: const SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Socle mobile initialisé', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                SizedBox(height: 12),
                Text(
                  'Les écrans mobiles sont spécifiés dans docs/ui-handoff/.',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
