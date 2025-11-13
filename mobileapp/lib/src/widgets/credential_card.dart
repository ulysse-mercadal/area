import 'package:flutter/material.dart';

typedef VoidCallbackAsync = Future<void> Function();

enum CredentialStatusMobile { connected, disconnected, expired, error }

class CredentialCard extends StatelessWidget {
  final String serviceName;
  final String description;
  final String? logoUrl;
  final CredentialStatusMobile status;
  final VoidCallbackAsync? onConnect;
  final VoidCallbackAsync? onDisconnect;
  final VoidCallbackAsync? onRefresh;
  final String? className;

  const CredentialCard({
    Key? key,
    required this.serviceName,
    required this.description,
    this.logoUrl,
    this.status = CredentialStatusMobile.disconnected,
    this.onConnect,
    this.onDisconnect,
    this.onRefresh,
    this.className,
  }) : super(key: key);

  bool get _isDisconnected => status == CredentialStatusMobile.disconnected;
  bool get _isConnected => status == CredentialStatusMobile.connected;

  @override
  Widget build(BuildContext context) {
    final statusConfig = _statusConfig(status);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 2)),
        ],
        border: Border.all(
          color: _isDisconnected ? Colors.grey.shade300 : Colors.grey.shade200,
          width: 1,
        ),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: logoUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(logoUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _initials()),
                      )
                    : _initials(),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      serviceName,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    Text(description, style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildStatusBadge(statusConfig)),
              const SizedBox(width: 12),
              if (status == CredentialStatusMobile.error && onRefresh != null)
                _iconButton(context, Icons.refresh, onRefresh!),
              if (_isConnected && onDisconnect != null) _iconButton(context, Icons.link_off, onDisconnect!),
            ],
          ),
          const SizedBox(height: 12),
          if (_isDisconnected && onConnect != null)
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton.icon(
                onPressed: () async => await onConnect!(),
                icon: const Icon(Icons.add_link, size: 20),
                label: const Text('Connect', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF3E8FF),
                  foregroundColor: const Color(0xFF7F22FE),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _initials() {
    final initial = (serviceName.isNotEmpty ? serviceName[0].toUpperCase() : '?');
    return Center(child: Text(initial, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black54)));
  }

  Widget _buildStatusBadge(_StatusConfig cfg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: cfg.bgColor, borderRadius: BorderRadius.circular(6)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(cfg.icon, size: 16, color: cfg.textColor), const SizedBox(width: 6), Text(cfg.text, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cfg.textColor))]),
    );
  }

  Widget _iconButton(BuildContext context, IconData icon, VoidCallbackAsync cb) {
    return InkWell(
      onTap: () async => await cb(),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, size: 20, color: Colors.grey.shade700),
      ),
    );
  }
}

class _StatusConfig {
  final IconData icon;
  final String text;
  final Color bgColor;
  final Color textColor;
  _StatusConfig(this.icon, this.text, this.bgColor, this.textColor);
}

_StatusConfig _statusConfig(CredentialStatusMobile status) {
  switch (status) {
    case CredentialStatusMobile.connected:
      return _StatusConfig(Icons.check_circle, 'Connected', const Color(0xFFECFDF5), const Color(0xFF059669));
    case CredentialStatusMobile.error:
      return _StatusConfig(Icons.warning, 'Action Required', const Color(0xFFFEF3C7), const Color(0xFFD97706));
    case CredentialStatusMobile.expired:
      return _StatusConfig(Icons.error_outline, 'Expired', const Color(0xFFFFF1F2), Colors.redAccent);
    case CredentialStatusMobile.disconnected:
    default:
      return _StatusConfig(Icons.link_off, 'Not Connected', Colors.grey.shade100, Colors.grey.shade600);
  }
}
