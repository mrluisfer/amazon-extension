import { useCallback, useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';

/** Live-bound value of a WXT storage item (updates across popup/options/tabs). */
export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    void item.getValue().then(setValue);
    return item.watch((next) => setValue(next));
  }, [item]);

  const update = useCallback((next: T) => item.setValue(next), [item]);
  return [value, update] as const;
}
