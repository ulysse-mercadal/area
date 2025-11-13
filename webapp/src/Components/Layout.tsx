import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../Context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  sidebarItems?: Array<{
    icon: string;
    label: string;
    href: string;
    active?: boolean;
  }>;
  theme?: 'light' | 'dark';
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebarItems = [],
  theme = 'light',
  className = ''
}) => {
  const { user } = useAuth();
  const baseItems = React.useMemo(() => [
    { icon: 'add_road', label: 'My Workflows', href: '/workflows', active: false },
    { icon: 'key', label: 'Credentials', href: '/credentials', active: false },
    { icon: 'account_circle', label: 'Account', href: '/account', active: false },
  ], []);
  const initialItems = sidebarItems && sidebarItems.length > 0 ? sidebarItems : baseItems;

  const itemsWithAdmin = React.useMemo(() => {
    if (user && user.role === 'ADMIN') {
      return [
        ...initialItems,
        { icon: 'admin_panel_settings', label: 'Admin', href: '/admin/users', active: false }
      ];
    }
    return initialItems;
  }, [initialItems, user]);
  const backgroundClass = theme === 'dark' 
    ? 'bg-gray-900' 
    : 'bg-gradient-to-br from-gray-50 to-gray-100';
  
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('sidebar-collapsed');
      return raw === 'true';
    } catch (e) {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
    } catch (e) {
    }
  }, [collapsed]);

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const toggleMobile = () => setMobileOpen(v => !v);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`flex h-screen ${backgroundClass} ${className} gap-0`}>
      {itemsWithAdmin.length > 0 && (
        <div className={`hidden md:flex `}>
          <Sidebar items={itemsWithAdmin} theme={theme} collapsed={collapsed} onToggleCollapse={() => setCollapsed(v => !v)} />
        </div>
      )}

      {itemsWithAdmin.length > 0 && (
        <>
          <div
            className={`fixed inset-0 z-30 md:hidden transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!mobileOpen}
            onClick={() => setMobileOpen(false)}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </div>

          <aside
            className={`fixed top-0 left-0 bottom-0 z-40 w-64 transform md:hidden transition-transform bg-transparent ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            role="dialog"
            aria-modal={mobileOpen}
          >
            <Sidebar items={itemsWithAdmin} theme={theme} />
          </aside>
        </>
      )}

    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-opacity-50">
          <button
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={toggleMobile}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <span className="material-icons">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
          <div />
        </header>

        <div className="w-full flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
};
