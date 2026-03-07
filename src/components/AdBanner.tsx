'use client';

import { useEffect, useId } from 'react';

declare global {
  interface Window {
    Ya: any;
    yaContextCb: any[];
  }
}

export default function AdBanner({ className, adSlot }: { className?: string; adSlot?: string }) {
  const uniqueId = useId().replace(/:/g, ''); // Generate a safe ID for DOM
  const blockId = adSlot || 'R-A-16817880-35'; // User provided block ID
  // Simplified container ID to match the user's manual code structure more closely
  const containerId = `yandex_rtb_${blockId.replace(/-/g, '_')}_${uniqueId}`;

  useEffect(() => {
    // Ensure yaContextCb exists
    window.yaContextCb = window.yaContextCb || [];
    
    // Push the render command to the queue
    window.yaContextCb.push(() => {
      // CRITICAL: Check if container actually exists in DOM before rendering
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`Ad container ${containerId} not found, skipping render`);
        return;
      }

      if (window.Ya && window.Ya.Context && window.Ya.Context.AdvManager) {
        window.Ya.Context.AdvManager.render({
          blockId: blockId,
          renderTo: containerId
        });
      }
    });
  }, [blockId, containerId]);

  return (
    <div className={`relative w-full overflow-hidden flex items-center justify-center bg-gray-50 border border-black/5 rounded-lg min-h-[100px] ${className}`}>
      {/* Yandex RTB Block Container */}
      <div id={containerId} className="w-full h-full"></div>
      
      {/* Placeholder for development */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <span className="text-[10px] font-bold uppercase tracking-widest">Yandex Ads</span>
      </div>
    </div>
  );
}