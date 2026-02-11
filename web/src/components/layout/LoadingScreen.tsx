'use client';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]">
      {/* Pulsing concentric circles */}
      <div className="relative h-32 w-32">
        <div className="loading-ring absolute inset-0 rounded-full border border-white/20" />
        <div
          className="loading-ring absolute inset-3 rounded-full border border-white/15"
          style={{ animationDelay: '0.3s' }}
        />
        <div
          className="loading-ring absolute inset-6 rounded-full border border-white/10"
          style={{ animationDelay: '0.6s' }}
        />
        <div
          className="loading-ring absolute inset-9 rounded-full border border-cyan-400/30"
          style={{ animationDelay: '0.9s' }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-cyan-400/60 loading-pulse" />
        </div>
      </div>

      <p className="mt-8 text-sm tracking-widest text-white/50 uppercase">
        Loading the Knowledge Commons...
      </p>

      <style jsx>{`
        @keyframes ringPulse {
          0% {
            transform: scale(0.85);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.3;
          }
        }
        @keyframes dotPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.4);
            opacity: 1;
          }
        }
        .loading-ring {
          animation: ringPulse 2.4s ease-in-out infinite;
        }
        .loading-pulse {
          animation: dotPulse 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
