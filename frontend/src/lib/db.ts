import path from 'path';

let db: any = null;

export function getDb() {
  if (db) return db;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = require('@supabase/supabase-js');
    db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return db;
  }

  const Database = require('better-sqlite3');
  db = new Database(path.join('/tmp', 'app.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      category TEXT,
      prep_time_minutes INTEGER,
      cook_time_minutes INTEGER,
      servings INTEGER,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      quantity TEXT,
      unit TEXT
    );

    CREATE TABLE IF NOT EXISTS instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      text TEXT NOT NULL
    );
  `);

  db.pragma('foreign_keys = ON');

  const count = db.prepare('SELECT COUNT(*) as c FROM recipes').get() as { c: number };
  if (count.c === 0) {
    const insertRecipe = db.prepare(
      `INSERT INTO recipes (title, slug, description, category, prep_time_minutes, cook_time_minutes, servings) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const insertIngredient = db.prepare(
      `INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)`
    );
    const insertInstruction = db.prepare(
      `INSERT INTO instructions (recipe_id, step_number, text) VALUES (?, ?, ?)`
    );

    const r1 = insertRecipe.run('Spaghetti Bolognese', 'spaghetti-bolognese', 'Classic Italian meat sauce with pasta', 'Italian', 15, 45, 4);
    insertIngredient.run(r1.lastInsertRowid, 'Spaghetti', '400', 'g');
    insertIngredient.run(r1.lastInsertRowid, 'Ground Beef', '500', 'g');
    insertIngredient.run(r1.lastInsertRowid, 'Tomato Sauce', '2', 'cups');
    insertInstruction.run(r1.lastInsertRowid, 1, 'Boil water and cook spaghetti according to package directions');
    insertInstruction.run(r1.lastInsertRowid, 2, 'Brown the ground beef in a large skillet');
    insertInstruction.run(r1.lastInsertRowid, 3, 'Add tomato sauce and simmer for 20 minutes, then serve over pasta');

    const r2 = insertRecipe.run('Chicken Stir Fry', 'chicken-stir-fry', 'Quick and healthy Asian-inspired dish', 'Asian', 10, 15, 2);
    insertIngredient.run(r2.lastInsertRowid, 'Chicken Breast', '300', 'g');
    insertIngredient.run(r2.lastInsertRowid, 'Soy Sauce', '3', 'tbsp');
    insertInstruction.run(r2.lastInsertRowid, 1, 'Slice chicken and vegetables into thin strips');
    insertInstruction.run(r2.lastInsertRowid, 2, 'Stir fry chicken until golden, add vegetables and soy sauce, cook 5 more minutes');

    const r3 = insertRecipe.run('Caesar Salad', 'caesar-salad', 'Crispy romaine with creamy Caesar dressing', 'Salads', 15, 0, 2);
    insertIngredient.run(r3.lastInsertRowid, 'Romaine Lettuce', '1', 'head');
    insertInstruction.run(r3.lastInsertRowid, 1, 'Chop romaine, toss with dressing, croutons, and parmesan');

    const r4 = insertRecipe.run('Beef Tacos', 'beef-tacos', 'Seasoned ground beef in crispy tortillas', 'Mexican', 10, 20, 4);
    insertIngredient.run(r4.lastInsertRowid, 'Ground Beef', '400', 'g');
    insertIngredient.run(r4.lastInsertRowid, 'Taco Shells', '8', 'pieces');
    insertInstruction.run(r4.lastInsertRowid, 1, 'Brown beef with taco seasoning, serve in shells with toppings');
  }

  return db;
}

// Helper to check if db is supabase
export function isSupabase(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}