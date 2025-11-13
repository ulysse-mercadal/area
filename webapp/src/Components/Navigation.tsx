import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';



interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onDoc = (e: PointerEvent | MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setMobileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <nav ref={containerRef} className={`bg-gray-100/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 lg:px-48 ${className}`}> 
      <div className="max-w-7xl mx-auto px-0 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <a href="/login" className="text-gray-700 hover:text-gray-900 font-semibold font-sora">Log In</a>
              <Button onClick={() => navigate('/register')} variant="primary" size="md">Get Started</Button>
            </div>
            <div className="md:hidden relative">
              <button
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileOpen(v => !v)}
                className="p-2 rounded-md"
              >
                <span className="material-icons">menu</span>
              </button>

              {mobileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border-gray-300 rounded-xl shadow-2xl z-50 py-2">
                  <div className="border-t my-2 border-gray-300" />
                  <div className="px-3 py-2 space-y-2">
                    <a href="/login" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md" onClick={() => setMobileOpen(false)}>Log In</a>
                    <button className="w-full text-left px-3 py-2 rounded-md bg-[#7F22FE] text-white hover:bg-[#6918d4]" onClick={() => { setMobileOpen(false); navigate('/register'); }}>Get Started</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
