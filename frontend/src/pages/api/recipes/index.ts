import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb, isSupabase } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { category, search } = req.query;
  const db = getDb();

  if (isSupabase()) {
    let query = db.from('recipes').select('*').order('created_at', { ascending: false });
    if (category && category !== 'All') query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);
    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    return res.status(200).json(data);
  }

  let sql = 'SELECT * FROM recipes';
  const params: any[] = [];
  const conditions: string[] = [];

  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('title LIKE ?');
    params.push(`%${search}%`);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY created_at DESC';

  const recipes = db.prepare(sql).all(...params);
  return res.status(200).json(recipes);
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { title, description, category, prep_time_minutes, cook_time_minutes, servings, image_url, ingredients, instructions } = req.body;

  if (!title) return res.status(400).json({ message: 'Title is required' });

  const db = getDb();
  const slug = generateSlug(title);

  if (isSupabase()) {
    const { data: recipe, error } = await db.from('recipes').insert({
      title, slug, description: description || null, category: category || null,
      prep_time_minutes: prep_time_minutes || null, cook_time_minutes: cook_time_minutes || null,
      servings: servings || null, image_url: image_url || null,
    }).select().single();

    if (error) return res.status(500).json({ message: error.message });

    let insertedIngredients: any[] = [];
    let insertedInstructions: any[] = [];

    if (ingredients?.length) {
      const { data, error: ie } = await db.from('ingredients').insert(
        ingredients.map((i: any) => ({ recipe_id: recipe.id, name: i.name, quantity: i.quantity || null, unit: i.unit || null }))
      ).select();
      if (!ie) insertedIngredients = data || [];
    }

    if (instructions?.length) {
      const { data, error: ie } = await db.from('instructions').insert(
        instructions.map((i: any, idx: number) => ({ recipe_id: recipe.id, step_number: i.step_number || idx + 1, text: i.text }))
      ).select();
      if (!ie) insertedInstructions = data || [];
    }

    return res.status(201).json({ ...recipe, ingredients: insertedIngredients, instructions: insertedInstructions });
  }

  // SQLite
  const result = db.prepare(
    `INSERT INTO recipes (title, slug, description, category, prep_time_minutes, cook_time_minutes, servings, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(title, slug, description || null, category || null, prep_time_minutes || null, cook_time_minutes || null, servings || null, image_url || null);

  const recipeId = result.lastInsertRowid;
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);

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

  return res.status(201).json({ ...recipe, ingredients: insertedIngredients, instructions: insertedInstructions });
}