'use client';

import React from 'react';

interface TimerClockProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  className?: string;
}

const TimerClock: React.FC<TimerClockProps> = ({ timeLeft, totalTime, size = 60, className }) => {
  const radius = size / 2 - 4; // radius of the circle
  const circumference = 2 * Math.PI * radius;
  
  // Ensure totalTime is not zero to avoid division by zero
  const progress = totalTime > 0 ? Math.max(0, timeLeft) / totalTime : 0;
  const offset = circumference * (1 - progress);

  const displayTime = Math.max(0, Math.ceil(timeLeft));

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-foreground/10"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300"
        />
      </svg>
      {/* Text in the middle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black text-foreground" style={{ fontSize: size / 2.5 }}>
          {displayTime}
        </span>
      </div>
    </div>
  );
};

export default TimerClock;
