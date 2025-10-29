import { useRef, useCallback } from 'react';

/**
 * Custom hook for rate limiting API calls
 * @param {number} maxCalls - Maximum calls allowed per time window
 * @param {number} timeWindow - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {Object} { checkRateLimit, getRemainingCalls }
 */
export const useRateLimit = (maxCalls = 10, timeWindow = 60000) => {
  const callTimestamps = useRef([]);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - timeWindow;

    // Remove timestamps outside the current window
    callTimestamps.current = callTimestamps.current.filter(
      timestamp => timestamp > windowStart
    );

    // Check if limit exceeded
    if (callTimestamps.current.length >= maxCalls) {
      const oldestCall = callTimestamps.current[0];
      const resetTime = Math.ceil((oldestCall + timeWindow - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetIn: resetTime
      };
    }

    // Add current timestamp
    callTimestamps.current.push(now);

    return {
      allowed: true,
      remaining: maxCalls - callTimestamps.current.length,
      resetIn: Math.ceil(timeWindow / 1000)
    };
  }, [maxCalls, timeWindow]);

  const getRemainingCalls = useCallback(() => {
    const now = Date.now();
    const windowStart = now - timeWindow;

    callTimestamps.current = callTimestamps.current.filter(
      timestamp => timestamp > windowStart
    );

    return maxCalls - callTimestamps.current.length;
  }, [maxCalls, timeWindow]);

  return { checkRateLimit, getRemainingCalls };
};

/**
 * Custom hook for debouncing values
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
