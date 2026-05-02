import 'package:flutter/material.dart';
import 'auth_window.dart';

class SignupPage extends StatelessWidget {
  const SignupPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const AuthWindow(mode: AuthMode.signup);
  }
}
