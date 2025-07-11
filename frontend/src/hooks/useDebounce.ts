import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [dbVal, setDbVal] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDbVal(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return dbVal;
}
