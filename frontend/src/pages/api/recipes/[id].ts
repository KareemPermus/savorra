import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb, isSupabase } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const recipeId = Number(id);
  if (isNaN(recipeId)) return res.status(400).json({ message: 'Invalid ID' });

  if (req.method === 'GET') return handleGet(recipeId, res);
  if (req.method === 'PUT') return handlePut(recipeId, req, res);
  if (req.method === 'DELETE') return handleDelete(recipeId, res);
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleGet(recipeId: number, res: NextApiResponse) {
  const db = getDb();

  if (isSupabase()) {
    const { data: recipe, error } = await db.from('recipes').select('*').eq('id', recipeId).single();
    if (error || !recipe) return res.status(404).json({ message: 'Recipe not found' });
    const { data: ingredients } = await db.from('ingredients').select('*').eq('recipe_id', recipeId);
    const { data: instructions } = await db.from('instructions').select('*').eq('recipe_id', recipeId).order('step_number');
    return res.status(200).json({ ...recipe, ingredients: ingredients || [], instructions: instructions || [] });
  }

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ?').all(recipeId);
  const instructions = db.prepare('SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number').all(recipeId);
  return res.status(200).json({ ...recipe, ingredients, instructions });
}

async function handlePut(recipeId: number, req: NextApiRequest, res: NextApiResponse) {
  const { title, description, category, prep_time_minutes, cook_time_minutes, servings, image_url, ingredients, instructions } = req.body;
  const db = getDb();

  if (isSupabase()) {
    const { data: existing } = await db.from('recipes').select('id').eq('id', recipeId).single();
    if (!existing) return res.status(404).json({ message: 'Recipe not found' });

    const { error } = await db.from('recipes').update({
      title, description: description || null, category: category || null,
      prep_time_minutes: prep_time_minutes || null, cook_time_minutes: cook_time_minutes || null,
      servings: servings || null, image_url: image_url || null,
    }).eq('id', recipeId);
    if (error) return res.status(500).json({ message: error.message });

    // Replace ingredients
    await db.from('ingredients').delete().eq('recipe_id', recipeId);
    let insertedIngredients: any[] = [];
    if (ingredients?.length) {
      const { data } = await db.from('ingredients').insert(
        ingredients.map((i: any) => ({ recipe_id: recipeId, name: i.name, quantity: i.quantity || null, unit: i.unit || null }))
      ).select();
      insertedIngredients = data || [];
    }

    // Replace instructions
    await db.from('instructions').delete().eq('recipe_id', recipeId);
    let insertedInstructions: any[] = [];
    if (instructions?.length) {
      const { data } = await db.from('instructions').insert(
        instructions.map((i: any, idx: number) => ({ recipe_id: recipeId, step_number: i.step_number || idx + 1, text: i.text }))
      ).select();
      insertedInstructions = data || [];
    }

    const { data: recipe } = await db.from('recipes').select('*').eq('id', recipeId).single();
    return res.status(200).json({ ...recipe, ingredients: insertedIngredients, instructions: insertedInstructions });
  }

  // SQLite
  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!existing) return res.status(404).json({ message: 'Recipe not found' });

  db.prepare(
    `UPDATE recipes SET title=?, description=?, category=?, prep_time_minutes=?, cook_time_minutes=?, servings=?, image_url=? WHERE id=?`
  ).run(title, description || null, category || null, prep_time_minutes || null, cook_time_minutes || null, servings || null, image_url || null, recipeId);

  db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(recipeId);
  db.prepare('DELETE FROM instructions WHERE recipe_id = ?').run(recipeId);

  const insertedIngredients: any[] = [];
  if (ingredients?.length) {
    const stmt = db.prepare('INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)');
    for (const i of ingredients) {
      const r = stmt.run(recipeId, i.name, i.quantity || null, i.unit || null);
      insertedIngredients.push({ id: Number(r.lastInsertRowid), name: i.name, quantity: i.quantity || '', unit: i.unit || '' });
    }
  }

  const insertedInstructions: any[] = [];
  if (instructions?.length) {
    const stmt = db.prepare('INSERT INTO instructions (recipe_id, step_number, text) VALUES (?, ?, ?)');
    instructions.forEach((i: any, idx: number) => {
      const r = stmt.run(recipeId, i.step_number || idx + 1, i.text);
      insertedInstructions.push({ id: Number(r.lastInsertRowid), step_number: i.step_number || idx + 1, text: i.text });
    });
  }

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  return res.status(200).json({ ...recipe, ingredients: insertedIngredients, instructions: insertedInstructions });
}

async function handleDelete(recipeId: number, res: NextApiResponse) {
  const db = getDb();

  if (isSupabase()) {
    const { data: existing } = await db.from('recipes').select('id').eq('id', recipeId).single();
    if (!existing) return res.status(404).json({ message: 'Recipe not found' });
    await db.from('ingredients').delete().eq('recipe_id', recipeId);
    await db.from('instructions').delete().eq('recipe_id', recipeId);
    await db.from('recipes').delete().eq('id', recipeId);
    return res.status(200).json({ message: 'Recipe deleted successfully' });
  }

  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!existing) return res.status(404).json({ message: 'Recipe not found' });
  db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(recipeId);
  db.prepare('DELETE FROM instructions WHERE recipe_id = ?').run(recipeId);
  db.prepare('DELETE FROM recipes WHERE id = ?').run(recipeId);
  return res.status(200).json({ message: 'Recipe deleted successfully' });
}