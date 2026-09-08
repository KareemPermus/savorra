/**
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

// Force SQLite path
delete process.env.NEXT_PUBLIC_SUPABASE_URL;

import recipesHandler from '@/pages/api/recipes/index';
import recipeByIdHandler from '@/pages/api/recipes/[id]';

describe('GET /api/recipes', () => {
  it('returns a list of recipes', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await recipesHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('title');
    expect(data[0]).toHaveProperty('id');
  });

  it('filters by category', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', query: { category: 'Italian' } });
    await recipesHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    data.forEach((r: any) => expect(r.category).toBe('Italian'));
  });
});

describe('POST /api/recipes', () => {
  it('creates a recipe', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        title: 'Test Recipe',
        description: 'A test',
        category: 'Test',
        ingredients: [{ name: 'Salt', quantity: '1', unit: 'tsp' }],
        instructions: [{ step_number: 1, text: 'Do something' }],
      },
    });
    await recipesHandler(req, res);
    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.title).toBe('Test Recipe');
    expect(data.ingredients).toHaveLength(1);
    expect(data.instructions).toHaveLength(1);
  });

  it('rejects missing title', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { description: 'No title' },
    });
    await recipesHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });
});

describe('GET /api/recipes/[id]', () => {
  it('returns a recipe with ingredients and instructions', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', query: { id: '1' } });
    await recipeByIdHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('ingredients');
    expect(data).toHaveProperty('instructions');
  });

  it('returns 404 for non-existent recipe', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', query: { id: '99999' } });
    await recipeByIdHandler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });
});

describe('PUT /api/recipes/[id]', () => {
  it('updates a recipe', async () => {
    // First create one
    const { req: cReq, res: cRes } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { title: 'Update Me', ingredients: [], instructions: [] },
    });
    await recipesHandler(cReq, cRes);
    const created = JSON.parse(cRes._getData());

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'PUT',
      query: { id: String(created.id) },
      body: { title: 'Updated Title', ingredients: [], instructions: [] },
    });
    await recipeByIdHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.title).toBe('Updated Title');
  });
});

describe('DELETE /api/recipes/[id]', () => {
  it('deletes a recipe', async () => {
    const { req: cReq, res: cRes } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { title: 'Delete Me', ingredients: [], instructions: [] },
    });
    await recipesHandler(cReq, cRes);
    const created = JSON.parse(cRes._getData());

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: { id: String(created.id) },
    });
    await recipeByIdHandler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('Recipe deleted successfully');
  });

  it('returns 404 deleting non-existent', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: { id: '99999' },
    });
    await recipeByIdHandler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });
});