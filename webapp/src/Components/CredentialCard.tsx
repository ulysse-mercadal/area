import React from 'react';

interface CredentialCardProps {
  serviceName: string;
  logo: string;
  description: string;
  status: 'connected' | 'disconnected';
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  serviceName,
  logo,
  description,
  status,
  onConnect,
  onDisconnect,
  className = ''
}) => {
  const statusConfig = {
    connected: {
      icon: 'check_circle',
      text: 'Connected',
      color: 'text-green-600'
    },
    disconnected: {
      icon: 'link_off',
      text: 'Not Connected',
      color: 'text-gray-600'
    },
  };
  
  const currentStatus = statusConfig[status];
  const isDisconnected = status === 'disconnected';
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${isDisconnected ? 'border-2 border-dashed border-gray-300' : ''} ${className}`}>
      <div className="flex items-center gap-6 mb-4">
        <img 
          src={logo} 
          alt={`${serviceName} logo`}
          className={`w-10 h-10 ${isDisconnected ? 'opacity-50' : ''}`}
        />
        <div className="flex-1">
          <h3 className={`font-bold text-lg font-sora ${isDisconnected ? 'opacity-50' : 'text-gray-800'}`}>
            {serviceName}
          </h3>
          <p className="text-sm text-gray-600 font-sora">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-6">
        <span className={`material-icons text-base ${currentStatus.color}`}>
          {currentStatus.icon}
        </span>
        <span className={`text-sm font-semibold font-sora ${currentStatus.color}`}>
          {currentStatus.text}
        </span>
      </div>
      
      <div className="flex justify-center">
        {isDisconnected ? (
          onConnect && (
            <button
              onClick={onConnect}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-[#7F22FE] rounded-lg hover:bg-purple-200 transition-colors font-semibold font-sora"
            >
              <span className="material-icons text-2xl">add_link</span>
              Connect
            </button>
          )
        ) : (
          <div className="flex justify-end gap-2 w-full">
            {onDisconnect && (
              <button
                onClick={onDisconnect}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold font-sora"
              >
                <span className="material-icons text-2xl">link_off</span>
                Disconnect
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
