/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/assets/route';
import { getServerSession } from 'next-auth';
import { getAssets } from '@/lib/services/assetService';

vi.mock('next-auth');
vi.mock('@/lib/services/assetService');
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Asset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns assets if authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1' },
      } as any);
      
      const mockAssets = [{ id: '1', name: 'Bitcoin' }];
      vi.mocked(getAssets).mockResolvedValue(mockAssets as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAssets);
    });

    it('returns 500 if service throws', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1' },
      } as any);
      
      vi.mocked(getAssets).mockRejectedValue(new Error('DB Error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal Server Error' });
    });
  });
});
