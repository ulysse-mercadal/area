export type PopupType = 'success' | 'executing' | 'error' | 'custom';

export interface ShowPopupOptions {
  type?: PopupType;
  id?: string;
  persistent?: boolean;
  color?: string;
  textColor?: string;
}

export function showPopup(text: string, opts?: ShowPopupOptions): string {
  const { type = 'success', id = `wf-popup-${Date.now()}`, persistent = false, color, textColor } = opts || {};
  removePopup(id);
  const el = document.createElement('div');
  el.id = id;
  el.textContent = text;
  const container = document.getElementById('execute-workflow-container');

  Object.assign(el.style, {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    color: textColor || '#fff',
    padding: '10px 16px',
    borderRadius: '10px',
    zIndex: '9999',
    fontSize: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    opacity: '1',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'auto',
  });

  const defaultColors: Record<PopupType, string> = {
    success: '#10b981',
    executing: '#fb923c',
    error: '#ef4444',
    custom: '#64748b',
  };
  el.style.background = color || defaultColors[type] || defaultColors.custom;

  if (type === 'executing') {
    const spinner = document.createElement('span');
    Object.assign(spinner.style, {
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'rgba(255,255,255,1)',
      display: 'inline-block',
      animation: 'wf-spin 1s linear infinite',
    });
    const styleTagId = 'wf-popup-spinner-style';
    if (!document.getElementById(styleTagId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleTagId;
      styleTag.innerHTML = `@keyframes wf-spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`;
      document.head.appendChild(styleTag);
    }
    el.prepend(spinner);
  }

  document.body.appendChild(el);

  if (container) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    Object.assign(el.style, {
      left: `${centerX}px`,
      top: `${rect.top}px`,
      transform: 'translate(-50%, -110%)',
    });
  } else {
    Object.assign(el.style, {
      left: '50%',
      bottom: '6.5rem',
      top: 'auto',
      transform: 'translateX(-50%)',
    });
  }

  if (!persistent) {
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = el.style.transform + ' translateY(-4px)';
    }, 1700);
    setTimeout(() => removePopup(id), 2000);
  }

  return id;
}

export function removePopup(id: string) {
  const existing = document.getElementById(id);
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
}
