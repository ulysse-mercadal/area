import React, { useEffect, useState } from 'react';
import {Layout, Header, CredentialCard, Button} from '../../Components';

export const CredentialsDashboard: React.FC = () => {
  const sidebarItems = [
    { icon: 'add_road', label: 'My Workflows', href: '/workflows', active: false },
    { icon: 'key', label: 'Credentials', href: '/credentials', active: true },
    { icon: 'account_circle', label: 'Account', href: '/account', active: false },
  ];

    const API_URL = import.meta.env.VITE_API_URL;

  const [services, setServices] = useState<Array<any>>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const handleConnect = async (serviceName: string) => {
    const svc = services.find((s) => s.name === serviceName);
    if (!svc || !svc.id) {
      console.error('Service not found for connect:', serviceName);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}/credentials/connect/${encodeURIComponent(svc.id)}`;
      console.log('Connecting to service:', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        console.error('Connect request failed:', res.status, await res.text());
        return;
      }

      const data = await res.json();
      if (data?.success && data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('Invalid connect response:', data);
      }
    } catch (err) {
      console.error('Error during connect request:', err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingServices(true);
      const token = localStorage.getItem('token');
      try {
  const servicesRes = await fetch(`${API_URL}/services`, { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!servicesRes.ok) throw new Error('Failed to fetch services');
        const servicesData = await servicesRes.json();

        let userId: number | null = null;
        if (token) {
          const meRes = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            userId = meData.id ?? meData.sub ?? null;
          }
        }

        let creds: any[] = [];
        if (userId) {
          const credsRes = await fetch(`${API_URL}/credentials/user/${userId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (credsRes.ok) {
            creds = await credsRes.json();
          }
        }

        const connectedByService = new Map<number, any>();
        creds.forEach((c: any) => {
          if (c.serviceId) connectedByService.set(c.serviceId, c);
        });

        const annotatedServices = (servicesData || []).map((s: any) => ({
          ...s,
          status: connectedByService.has(s.id) ? 'connected' : 'disconnected',
          credentialId: connectedByService.get(s.id)?.id ?? null,
        }));

  setServices(annotatedServices);
  setCurrentUserId(userId);
      } catch (err) {
        console.error('Error fetching services/user/creds:', err);
  setServices([]);
  setCurrentUserId(null);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchAll();
  }, []);
  

  return (
    <Layout sidebarItems={sidebarItems}>
      <Header
        title="Manage Credentials"
        description="Add, view, and remove your service credentials"
      />
      
      <div className="flex-1 p-6 overflow-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-7xl">
          {loadingServices ? (
            <div>Loading services...</div>
          ) : (
            services.map((s: any) => (
              <CredentialCard
                key={s.id}
                serviceName={s.name}
                logo={s.iconUrl}
                description={`${s._count?.actions ?? 0} actions • ${s._count?.reactions ?? 0} reactions`}
                status={s.status}
                onConnect={() => handleConnect(s.name)}
                onDisconnect={async () => {
                  if (!currentUserId) return;
                  const token = localStorage.getItem('token');
                  try {
                    const res = await fetch(`${API_URL}/credentials/user/${currentUserId}/service/${s.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) {
                      console.error('Failed to revoke credential', await res.text());
                      return;
                    }
                    setServices(prev => prev.map(ps => ps.id === s.id ? { ...ps, status: 'disconnected', credentialId: null } : ps));
                  } catch (err) {
                    console.error('Error revoking credential:', err);
                  }
                }}
                className="h-56"
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};
