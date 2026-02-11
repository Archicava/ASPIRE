import { platformConfig } from '@/lib/config';
import { StorageAdapter } from './types';
import { getCstoreBackend } from './cstore-backend';
import { getJsonBackend } from './json-backend';

export type { StorageAdapter } from './types';
export { getJsonBackend } from './json-backend';

export function getStorageAdapter(): StorageAdapter {
  if (platformConfig.useLocal) {
    return getJsonBackend();
  }
  return getCstoreBackend();
}
