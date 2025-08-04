import { useState, useEffect } from 'react';
import { User } from '@shared/schema';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount - with delay to prevent rapid requests
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        // Silently handle auth errors to prevent console spam
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
  }, []);

  return { user, setUser, isLoading };
}