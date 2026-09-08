import apiClient from '@/api/client';
import { apiClient as namedClient } from '@/api/client';

describe('API client', () => {
  it('exports default and named', () => {
    expect(apiClient).toBeDefined();
    expect(namedClient).toBeDefined();
    expect(apiClient).toBe(namedClient);
  });

  it('has empty baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe('');
  });
});