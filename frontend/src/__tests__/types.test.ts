import type { Recipe, Ingredient, Instruction, RecipeDetail, DeleteResponse } from '@/types';

describe('Shared types', () => {
  it('Recipe type has required fields', () => {
    const r: Recipe = { id: 1, title: 'Test', created_at: '2024-01-01' };
    expect(r.id).toBe(1);
    expect(r.title).toBe('Test');
  });

  it('Ingredient type has required fields', () => {
    const i: Ingredient = { id: 1, recipe_id: 1, name: 'Salt' };
    expect(i.name).toBe('Salt');
  });

  it('Instruction type has required fields', () => {
    const inst: Instruction = { id: 1, recipe_id: 1, step_number: 1, text: 'Mix' };
    expect(inst.step_number).toBe(1);
  });
});