import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/design_system/cnpm_theme.dart';

class MobileAppShell extends StatelessWidget {
  const MobileAppShell({
    required this.title,
    required this.body,
    required this.onSignOut,
    this.selectedIndex = 0,
    this.leading,
    super.key,
  });

  final String title;
  final Widget body;
  final VoidCallback onSignOut;
  final int selectedIndex;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: leading,
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            tooltip: 'Se déconnecter',
            onPressed: onSignOut,
            icon: const Icon(Icons.logout),
          ),
          const SizedBox(width: CnpmSpacing.x1),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: CnpmSizes.tabletContentMax,
            ),
            child: body,
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: NavigationBar(
          selectedIndex: selectedIndex,
          onDestinationSelected: (index) {
            if (index == selectedIndex) {
              return;
            }
            switch (index) {
              case 0:
                context.go('/home');
              case 1:
                context.go('/payments');
              case 2:
                context.go('/receipts');
              case 3:
                context.go('/requests');
              case 4:
                ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Cette destination n’est pas encore disponible dans la démonstration.',
                      ),
                    ),
                  );
            }
          },
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Accueil',
            ),
            NavigationDestination(
              icon: Semantics(
                label: 'Cotisations et paiements',
                excludeSemantics: true,
                child: const Icon(Icons.account_balance_wallet_outlined),
              ),
              selectedIcon: Semantics(
                label: 'Cotisations et paiements',
                excludeSemantics: true,
                child: const Icon(Icons.account_balance_wallet),
              ),
              label: 'Finances',
              tooltip: 'Cotisations et paiements',
            ),
            const NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long),
              label: 'Reçus',
            ),
            const NavigationDestination(
              icon: Icon(Icons.forum_outlined),
              selectedIcon: Icon(Icons.forum),
              label: 'Requêtes',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }
}
