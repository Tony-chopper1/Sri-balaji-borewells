// Sri Balaji Borewells - 10-Minute Inactivity Auto-Lock Hook
import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function useIdleTimer(onTimeout?: () => void) {
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (isLocked) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsLocked(true);
      if (onTimeout) onTimeout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [isLocked, onTimeout]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    resetTimer();

    for (const event of events) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of events) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [resetTimer]);

  return { isLocked, unlock, resetTimer };
}
