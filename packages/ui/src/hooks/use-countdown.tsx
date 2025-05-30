import { useState, useEffect } from 'react';

const formatTime = (seconds: number): string => {
  if (seconds <= 0) return 'This code has expired';
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `This code expires in ${minutes}:${remainingSecs.toString().padStart(2, '0')}`;
};

export const useCountdown = (date: Date): [number, string] => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    const initialSeconds = Math.max(
      0,
      Math.floor((date.getTime() - Date.now()) / 1000)
    );
    setRemainingSeconds(initialSeconds);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [date]);

  return [remainingSeconds, formatTime(remainingSeconds)];
};
