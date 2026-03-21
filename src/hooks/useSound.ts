'use client';

import { Howl } from 'howler';
import { useCallback, useState, useMemo } from 'react';

export type Sound = 'join' | 'leave' | 'guess' | 'round' | 'win' | 'time';

const soundFiles: Record<Sound, string> = {
  join: '/sounds/join.mp3',
  leave: '/sounds/leave.mp3',
  guess: '/sounds/guess.mp3',
  round: '/sounds/round.mp3',
  win: '/sounds/win.mp3',
  time: '/sounds/time.mp3',
};

const useSound = () => {
  const [isMuted, setIsMuted] = useState(false);

  const sounds = useMemo(() => {
    const loadedSounds: Partial<Record<Sound, Howl>> = {};
    for (const key in soundFiles) {
      const soundName = key as Sound;
      loadedSounds[soundName] = new Howl({
        src: [soundFiles[soundName]],
        volume: 0.3,
      });
    }
    return loadedSounds as Record<Sound, Howl>;
  }, []);

  const playSound = useCallback((sound: Sound) => {
    if (!isMuted && sounds[sound]) {
      sounds[sound].play();
    }
  }, [isMuted, sounds]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { playSound, toggleMute, isMuted };
};

export default useSound;
