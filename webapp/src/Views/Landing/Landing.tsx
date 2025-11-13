import React from 'react';
import { Navigation, Button } from '../../Components';
import { useNavigate } from 'react-router-dom';

function CarouselServices() {
  const services = [
    {
      id: 'gsheets',
      name: 'Google Sheets',
      logo: 'https://cdn-icons-png.flaticon.com/512/2965/2965327.png',
      desc: 'Store and update spreadsheets.',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/1280px-Gmail_icon_%282020%29.svg.png',
      desc: 'Send and receive emails.',
    },
    {
      id: 'twitch',
      name: 'Twitch',
      logo: 'https://images.seeklogo.com/logo-png/27/2/twitch-logo-png_seeklogo-274042.png',
      desc: 'Stream and interact with viewers.',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png',
      desc: 'Publish and manage videos.',
    },
    {
      id: 'spotify',
      name: 'Spotify',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
      desc: 'Play and manage music.',
    },
    {
      id: 'discord',
      name: 'Discord',
      logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/4f/Discord_Logo_sans_texte.svg/909px-Discord_Logo_sans_texte.svg.png',
      desc: 'Chat and receive notifications.',
    },
  ];

  const loopItems = [...services, ...services];

  return (
    <div className="relative">
  <style>{`\n        .carousel {\n          --speed: 20s;\n        }\n        .carousel-track {\n          display: flex;\n          gap: 1rem;\n          align-items: center;\n          animation: scroll-left var(--speed) linear infinite;\n        }\n        @keyframes scroll-left {\n          0% { transform: translateX(0); }\n          100% { transform: translateX(-50%); }\n        }\n      `}</style>

      <div className="overflow-hidden rounded-xl shadow-lg bg-white carousel">
        <div className="carousel-track px-6 py-6">
          {loopItems.map((s, idx) => (
            <div key={`${s.id}-${idx}`} className="flex items-center gap-4 min-w-[260px] bg-white">
              <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center p-3 shadow-sm">
                <img src={s.logo} alt={`${s.name} logo`} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h4 className="text-lg font-semibold text-gray-800 mb-1 font-sora">{s.name}</h4>
                <p className="text-sm text-gray-600 truncate">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-gray-800 mb-6 font-sora">
            Connect Your Apps,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400">
              Automate Your Life
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto font-sora">
            Stop wasting time on repetitive tasks. Automate lets you build workflows
            between your favorite apps like Spotify, Gmail and Discord so you can
            focus on what matters.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button onClick={() => navigate("/register")} size="lg" icon={<span className="material-icons">arrow_forward</span>}>
              Start for Free
            </Button>
          </div>
        </div>
        
        <div className="mb-20">
          <div className="max-w-4xl mx-auto relative">
            <CarouselServices />
          </div>
        </div>
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-sora">How it works</h2>
          <p className="text-lg text-gray-600 font-sora">Build powerful automations in three simple steps.</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:gap-8 gap-8">
          <div className="flex-1 min-w-0 text-center px-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-3xl text-[#7F22FE]">link</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 font-sora">1. Connect</h3>
            <p className="text-gray-600 font-sora">
              Link your accounts securely with our one-click integration.
            </p>
          </div>

          <div className="flex-1 min-w-0 text-center px-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-3xl text-[#7F22FE]">build</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 font-sora">2. Build</h3>
            <p className="text-gray-600 font-sora">
              Create custom workflows using our intuitive, no-code builder.
            </p>
          </div>

          <div className="flex-1 min-w-0 text-center px-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-3xl text-[#7F22FE]">autorenew</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 font-sora">3. Automate</h3>
            <p className="text-gray-600 font-sora">
              Sit back and watch your automations run seamlessly in the background.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 font-sora">© 2025 Flow Connect Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
