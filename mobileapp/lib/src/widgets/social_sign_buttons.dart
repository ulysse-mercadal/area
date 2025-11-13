import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:url_launcher/url_launcher.dart';
import '../app_theme.dart';

typedef SignCallback = void Function(String provider);

class SocialSignButtons extends StatelessWidget {
  final SignCallback onSign;


  const SocialSignButtons({Key? key, required this.onSign}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () async {
              String? api;
              try {
                api = dotenv.env['API_URL'];
              } catch (e) {
                try {
                  await dotenv.load(fileName: '.env').timeout(const Duration(seconds: 2));
                  api = dotenv.env['API_URL'];
                } catch (e2) {
                  api = null;
                }
              }
              if (api == null || api.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('API_URL not configured in .env')),
                );
                return;
              }
              final base = api.replaceAll(RegExp(r"/*$") , '');
              final url = Uri.parse('${base}/auth/google');
              try {
                final launched = await launchUrl(url, mode: LaunchMode.inAppWebView);
                if (!launched) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Could not open auth URL')),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error opening auth URL: $e')),
                );
              }
            },
            icon: const Icon(Icons.g_mobiledata, size: 20),
            label: const Text('Continue with Google'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.black,
              backgroundColor: Colors.white,
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () async {
              String? api;
              try {
                api = dotenv.env['API_URL'];
              } catch (e) {
                try {
                  await dotenv.load(fileName: '.env').timeout(const Duration(seconds: 2));
                  api = dotenv.env['API_URL'];
                } catch (e2) {
                  api = null;
                }
              }
              if (api == null || api.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('API_URL not configured in .env')),
                );
                return;
              }
              final base = api.replaceAll(RegExp(r"/*$") , '');
              final url = Uri.parse('${base}/auth/microsoft');
              try {
                final launched = await launchUrl(url, mode: LaunchMode.inAppWebView);
                if (!launched) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Could not open auth URL')),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error opening auth URL: $e')),
                );
              }
            },
            icon: Icon(Icons.business, size: 20),
            label: const Text('Continue with Microsoft'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primary,
              backgroundColor: Colors.white,
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () async {
              String? api;
              try {
                api = dotenv.env['API_URL'];
              } catch (e) {
                try {
                  await dotenv.load(fileName: '.env').timeout(const Duration(seconds: 2));
                  api = dotenv.env['API_URL'];
                } catch (e2) {
                  api = null;
                }
              }
              if (api == null || api.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('API_URL not configured in .env')),
                );
                return;
              }
              final base = api.replaceAll(RegExp(r"/*$") , '');
              final url = Uri.parse('${base}/auth/github');
              try {
                final launched = await launchUrl(url, mode: LaunchMode.inAppWebView);
                if (!launched) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Could not open auth URL')),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error opening auth URL: $e')),
                );
              }
            },
            icon: const Icon(Icons.code, size: 20),
            label: const Text('Continue with GitHub'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.black,
              backgroundColor: Colors.white,
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }
}
