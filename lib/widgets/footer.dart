import 'package:flutter/material.dart';

class Footer extends StatelessWidget {
  const Footer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      color: Colors.grey[200],
      alignment: Alignment.center,
      child: const Text('Footer', style: TextStyle(fontSize: 20)),
    );
  }
}
