import '../app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:url_launcher/url_launcher.dart';

import '../widgets/bottom_nav_bar.dart';
import '../widgets/credential_card.dart';

class CredentialsPage extends StatefulWidget {
  const CredentialsPage({Key? key}) : super(key: key);

  @override
  State<CredentialsPage> createState() => _CredentialsPageState();
}

class _CredentialsPageState extends State<CredentialsPage> {
  bool _isLoading = true;
  List<dynamic> _services = [];
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<String?> _resolveApiUrl() async {
    var apiUrl = dotenv.env['API_URL'];
    if (apiUrl != null && apiUrl.isNotEmpty) return apiUrl;
    try {
      await dotenv.load(fileName: '.env').timeout(const Duration(seconds: 3));
    } catch (_) {}
    apiUrl = dotenv.env['API_URL'];
    if (apiUrl != null && apiUrl.isNotEmpty) return apiUrl;
    try {
      final content = await rootBundle.loadString('.env');
      for (final line in content.split('\n')) {
        final trimmed = line.trim();
        if (trimmed.startsWith('API_URL')) {
          final parts = trimmed.split('=');
          if (parts.length >= 2) return parts.sublist(1).join('=').trim().replaceAll('"', '').replaceAll("'", '');
        }
      }
    } catch (_) {}
    return null;
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final apiUrl = await _resolveApiUrl();
    if (apiUrl == null) {
      setState(() => _isLoading = false);
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');

    try {
      final servicesRes = await http.get(Uri.parse('$apiUrl/services'));
      if (servicesRes.statusCode != 200) throw Exception('Failed to fetch services');
      final servicesData = jsonDecode(servicesRes.body) as List<dynamic>;

      int? userId;
      if (token != null) {
        final meRes = await http.get(Uri.parse('$apiUrl/auth/me'), headers: {'Authorization': 'Bearer $token'});
        if (meRes.statusCode == 200) {
          final me = jsonDecode(meRes.body);
          userId = me['id'] ?? me['sub'];
        }
      }

      List<dynamic> creds = [];
      if (userId != null) {
        final credsRes = await http.get(Uri.parse('$apiUrl/credentials/user/$userId'), headers: {'Authorization': 'Bearer $token'});
        if (credsRes.statusCode == 200) creds = jsonDecode(credsRes.body) as List<dynamic>;
      }

      final connectedByService = <dynamic, dynamic>{};
      for (final c in creds) {
        try {
          final sid = c['serviceId'] ?? c['service'];
          if (sid != null) connectedByService[sid] = c;
        } catch (_) {}
      }

      final annotated = servicesData.map((s) {
        final id = s['id'];
        final connected = connectedByService.containsKey(id);
        return {
          ...s,
          'status': connected ? 'connected' : 'disconnected',
          'credentialId': connected ? connectedByService[id]['id'] : null,
        };
      }).toList();

      setState(() {
        _services = annotated;
        _currentUserId = userId;
      });
    } catch (err) {
      setState(() {
        _services = [];
        _currentUserId = null;
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _connect(dynamic service) async {
    final apiUrl = await _resolveApiUrl();
    if (apiUrl == null) return;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    try {
      final res = await http.post(Uri.parse('$apiUrl/credentials/connect/${Uri.encodeComponent(service['id'].toString())}'), headers: {
        if (token != null) 'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      });
      if (res.statusCode != 200 && res.statusCode != 201) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Connect failed: ${res.statusCode}')));
        return;
      }
      final data = jsonDecode(res.body);
      final authUrl = data['authUrl'] ?? data['url'] ?? data['redirectUrl'];
      if (authUrl != null) {
        final uri = Uri.parse(authUrl.toString());
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.inAppWebView);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Cannot open auth URL')));
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No auth URL from server')));
      }
    } catch (err) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Connect error: $err')));
    }
  }

  Future<void> _disconnect(dynamic service) async {
    final apiUrl = await _resolveApiUrl();
    if (apiUrl == null || _currentUserId == null) return;
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    try {
      final res = await http.delete(Uri.parse('$apiUrl/credentials/user/$_currentUserId/service/${Uri.encodeComponent(service['id'].toString())}'), headers: {
        if (token != null) 'Authorization': 'Bearer $token',
      });
      if (res.statusCode == 200 || res.statusCode == 204) {
        setState(() {
          _services = _services.map((s) => s['id'] == service['id'] ? {...s, 'status': 'disconnected', 'credentialId': null} : s).toList();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to disconnect: ${res.statusCode}')));
      }
    } catch (err) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Disconnect error: $err')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Column(
          children: [
            const Text(
              'Manage Credentials',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Add, view, and remove your service credentials',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        toolbarHeight: 80,
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemCount: _services.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return Column(children: [
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _showAddCredential,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                              child: const Text('Add New Credential', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Colors.white)),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ]);
                      }

                      final svc = _services[index - 1];
                      final status = (svc['status'] ?? 'disconnected') as String;
                      return CredentialCard(
                        serviceName: svc['name'] ?? svc['id'].toString(),
                        description: svc['description'] ?? '',
                        logoUrl: null,
                        status: status == 'connected' ? CredentialStatusMobile.connected : CredentialStatusMobile.disconnected,
                        onConnect: () async => await _connect(svc),
                        onDisconnect: () async => await _disconnect(svc),
                      );
                    },
                  ),
          ),
          BottomNavBar(activeIndex: 0),
        ],
      ),
    );
  }

  Future<void> _showAddCredential() async {
    // If services list is empty, try reloading once before giving up.
    if (_services.isEmpty) {
      await _load();
      if (_services.isEmpty) {
        final apiUrl = await _resolveApiUrl();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('No services available. Check that your API is reachable. API_URL=${apiUrl ?? 'not set'}. For Android emulator use http://10.0.2.2:3000'),
          duration: const Duration(seconds: 6),
        ));
        return;
      }
    }

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Add Credential'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.separated(
              shrinkWrap: true,
              itemBuilder: (c, i) {
                final s = _services[i];
                final connected = (s['status'] ?? 'disconnected') == 'connected';
                return ListTile(
                  title: Text(s['name'] ?? s['id'].toString()),
                  subtitle: Text(s['description'] ?? ''),
                  trailing: connected
                      ? const Text('Connected', style: TextStyle(color: Colors.grey))
                      : ElevatedButton(
                          onPressed: () async {
                            Navigator.of(ctx).pop();
                            await _connect(s);
                          },
                          child: const Text('Connect'),
                        ),
                );
              },
              separatorBuilder: (_, __) => const Divider(),
              itemCount: _services.length,
            ),
          ),
          actions: [TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Close'))],
        );
      },
    );
  }


}
