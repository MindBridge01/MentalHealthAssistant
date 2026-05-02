import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AppNavbar extends StatefulWidget {
  final VoidCallback? onProfileTap;
  final VoidCallback? onSosTap;
  final String? profilePicUrl;

  const AppNavbar({
    super.key,
    this.onProfileTap,
    this.onSosTap,
    this.profilePicUrl,
  });

  @override
  State<AppNavbar> createState() => _AppNavbarState();
}

class _AppNavbarState extends State<AppNavbar> {
  bool _isMenuOpen = false;
  String? _localProfilePic;
  bool _isLoggedIn = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadLocalProfilePic();
    // Periodically check for profile pic updates (every 1 second)
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _loadLocalProfilePic(),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadLocalProfilePic() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final url = prefs.getString('profilePicUrl');
      final loggedIn = prefs.getBool('isLoggedIn') ?? false;
      if (mounted && url != _localProfilePic) {
        setState(() => _localProfilePic = url);
      }
      if (mounted && loggedIn != _isLoggedIn) {
        setState(() => _isLoggedIn = loggedIn);
      }
    } catch (_) {}
  }

  Future<void> _handleAuthTap() async {
    if (_isLoggedIn) {
      const storage = FlutterSecureStorage();
      final prefs = await SharedPreferences.getInstance();
      await storage.delete(key: 'auth_token');
      await prefs.remove('profilePicUrl');
      await prefs.setBool('isLoggedIn', false);
      if (!mounted) return;
      setState(() {
        _isLoggedIn = false;
        _localProfilePic = null;
        _isMenuOpen = false;
      });
      Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
      return;
    }

    Navigator.of(context).pushNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width >= 900;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: isWide ? 24 : 16,
          vertical: 12,
        ),
        child: isWide
            ? _buildDesktopNavbar(context)
            : _buildMobileNavbar(context),
      ),
    );
  }

  Widget _buildDesktopNavbar(BuildContext context) {
    return Row(
      children: [
        // Logo
        SizedBox(
          height: 50,
          child: Image.asset(
            'assets/logo/logolight.png',
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(width: 40),
        // Nav links
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildNavLink('Home', () => Navigator.of(context).pushNamed('/home')),
              const SizedBox(width: 32),
              _buildNavLink('AI Chat', () => Navigator.of(context).pushNamed('/ai-chat')),
              const SizedBox(width: 32),
              _buildNavLink('Community', () => Navigator.of(context).pushNamed('/community')),
              const SizedBox(width: 32),
              _buildNavLink('About', () => Navigator.of(context).pushNamed('/about')),
            ],
          ),
        ),
        const SizedBox(width: 32),
        // SOS and Profile buttons
        Row(
          children: [
            ElevatedButton.icon(
              onPressed: widget.onSosTap,
              icon: const Icon(Icons.warning_rounded, size: 18),
              label: const Text('SOS Help'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade600,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: _handleAuthTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E2F6B),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: Text(_isLoggedIn ? 'Logout' : 'Login'),
            ),
            const SizedBox(width: 12),
            _buildProfileButton(),
          ],
        ),
      ],
    );
  }

  Widget _buildMobileNavbar(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            SizedBox(
              height: 40,
              child: Image.asset(
                'assets/logo/logolight.png',
                fit: BoxFit.contain,
              ),
            ),
            Row(
              children: [
                _buildProfileButton(),
                const SizedBox(width: 12),
                TextButton(
                  onPressed: _handleAuthTap,
                  child: Text(
                    _isLoggedIn ? 'Logout' : 'Login',
                    style: const TextStyle(
                      color: Color(0xFF2E2F6B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () {
                    setState(() => _isMenuOpen = !_isMenuOpen);
                  },
                  child: Icon(
                    _isMenuOpen ? Icons.close : Icons.menu,
                    color: const Color(0xFF2E2F6B),
                    size: 24,
                  ),
                ),
              ],
            ),
          ],
        ),
        if (_isMenuOpen) ...[
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: Colors.grey[200]!),
              ),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                _buildNavLink('Home', () {
                  setState(() => _isMenuOpen = false);
                  Navigator.of(context).pushNamed('/home');
                }),
                const SizedBox(height: 12),
                _buildNavLink('AI Chat', () {
                  setState(() => _isMenuOpen = false);
                  Navigator.of(context).pushNamed('/ai-chat');
                }),
                const SizedBox(height: 12),
                _buildNavLink('Community', () {
                  setState(() => _isMenuOpen = false);
                  Navigator.of(context).pushNamed('/community');
                }),
                const SizedBox(height: 12),
                _buildNavLink('About', () {
                  setState(() => _isMenuOpen = false);
                  Navigator.of(context).pushNamed('/about');
                }),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: widget.onSosTap,
                    icon: const Icon(Icons.warning_rounded, size: 18),
                    label: const Text('SOS Help'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade600,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildNavLink(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: Color(0xFF2E2F6B),
        ),
      ),
    );
  }

  Widget _buildProfileButton() {
    final pic = (widget.profilePicUrl != null && widget.profilePicUrl!.isNotEmpty)
        ? widget.profilePicUrl
        : _localProfilePic;

    return GestureDetector(
      onTap: widget.onProfileTap,
      child: CircleAvatar(
        radius: 18,
        backgroundColor: Colors.grey[200],
        backgroundImage: pic != null && pic.isNotEmpty ? NetworkImage(pic) : null,
        child: pic == null || pic.isEmpty
            ? const Icon(
                Icons.person,
                color: Color(0xFF2E2F6B),
                size: 20,
              )
            : null,
      ),
    );
  }
}
