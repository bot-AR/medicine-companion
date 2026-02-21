'use client';

import { useState, useCallback } from 'react';
import type { AIResponse } from '@medicine/shared';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [offline, setOffline] = useState(false);

  const run = useCallback(async (task: string, context: Record<string, unknown>) => {
    setLoading(true);
    setResult(null);
    setOffline(false);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, context }),
      });
      if (!res.ok) throw new Error('unavailable');
      setResult(await res.json());
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResult(null), []);

  return { run, loading, result, offline, clear };
}
