import 'package:flutter/material.dart';

import 'package:cnpm_mobile/app/app_config.dart';
import 'package:cnpm_mobile/app/cnpm_app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(CnpmApp(config: AppConfig.fromEnvironment()));
}
