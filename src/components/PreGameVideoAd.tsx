'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Ya: any;
    yaContextCb: any[];
  }
}

export default function PreGameVideoAd({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // Ensure yaContextCb exists
    window.yaContextCb = window.yaContextCb || [];
    
    // Push the render command for the rewarded ad
    window.yaContextCb.push(() => {
      if (window.Ya && window.Ya.Context && window.Ya.Context.AdvManager) {
        window.Ya.Context.AdvManager.render({
          blockId: "R-A-16817880-34",
          type: "rewarded",
          platform: "desktop",
          onAdClosed: () => {
            console.log('Ad closed');
            onComplete();
          },
          onReward: () => {
            console.log('Reward granted');
            // You can add logic here if you want to reward the player
          },
          onError: (data: any) => {
            console.error('Ad error:', data);
            onComplete(); // Continue to game even if ad fails
          }
        });
      } else {
        // Fallback if SDK is not loaded
        onComplete();
      }
    });
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center text-white backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-xl font-bold">Loading Advertisement...</p>
        <p className="text-sm opacity-50">Please wait a moment</p>
      </div>
      
      {/* Manual skip fallback for dev/errors */}
      <button 
        onClick={onComplete}
        className="mt-8 text-xs opacity-20 hover:opacity-100 transition-opacity underline"
      >
        Skip if ad fails to load
      </button>
    </div>
  );
}