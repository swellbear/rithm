/**
 * React Optimization Hooks - Prevent unnecessary re-renders and optimize component performance
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Enhanced useCallback with dependency change detection
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const savedCallback = useRef<T>();
  const savedDeps = useRef<React.DependencyList>();

  // Check if dependencies have actually changed
  const depsChanged = !savedDeps.current || 
    deps.length !== savedDeps.current.length ||
    deps.some((dep, index) => dep !== savedDeps.current![index]);

  if (depsChanged) {
    savedCallback.current = callback;
    savedDeps.current = deps;
  }

  return useCallback(savedCallback.current!, deps);
}

/**
 * Deep comparison useMemo for complex objects
 */
export function useDeepMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  const depsChanged = !ref.current || 
    deps.length !== ref.current.deps.length ||
    deps.some((dep, index) => {
      const prevDep = ref.current!.deps[index];
      return JSON.stringify(dep) !== JSON.stringify(prevDep);
    });

  if (depsChanged) {
    ref.current = {
      deps: [...deps],
      value: factory()
    };
  }

  return ref.current.value;
}

/**
 * Prevent component re-renders when props haven't changed
 */
export function useRenderOptimization(componentName: string, props: any) {
  const renderCount = useRef(0);
  const propsRef = useRef(props);
  const hasPropsChanged = useRef(true);

  useEffect(() => {
    renderCount.current++;
    
    // Check if props actually changed
    const propsChanged = JSON.stringify(props) !== JSON.stringify(propsRef.current);
    hasPropsChanged.current = propsChanged;
    
    if (propsChanged) {
      propsRef.current = props;
    }

    // Warn about unnecessary re-renders
    if (!propsChanged && renderCount.current > 1) {
      console.warn(`Unnecessary re-render in ${componentName}: props haven't changed`);
    }
  });

  return {
    renderCount: renderCount.current,
    hasPropsChanged: hasPropsChanged.current
  };
}

/**
 * Batch state updates to prevent multiple re-renders
 */
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const batchedUpdatesRef = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setBatchedState = useCallback((updates: Partial<T>) => {
    // Accumulate updates
    batchedUpdatesRef.current = { ...batchedUpdatesRef.current, ...updates };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Batch updates in next tick
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...batchedUpdatesRef.current }));
      batchedUpdatesRef.current = {};
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setBatchedState] as const;
}

/**
 * Lazy initialization for expensive computations
 */
export function useLazyRef<T>(factory: () => T): React.MutableRefObject<T> {
  const ref = useRef<T>();
  
  if (ref.current === undefined) {
    ref.current = factory();
  }
  
  return ref as React.MutableRefObject<T>;
}

/**
 * Throttled callback to limit execution frequency
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;

    if (timeSinceLastCall >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }) as T, [callback, delay]);
}

/**
 * Intersection Observer hook for lazy loading components
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, options]);

  return [setNode, entry] as const;
}