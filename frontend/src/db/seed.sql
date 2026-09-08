INSERT INTO recipes (title, slug, description, category, prep_time_minutes, cook_time_minutes, servings, image_url)
VALUES ('Spaghetti Bolognese', 'spaghetti-bolognese', 'Classic Italian meat sauce with pasta', 'Italian', 15, 45, 4, NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes (title, slug, description, category, prep_time_minutes, cook_time_minutes, servings, image_url)
VALUES ('Chicken Stir Fry', 'chicken-stir-fry', 'Quick and healthy Asian-inspired dish', 'Asian', 10, 15, 2, NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes (title, slug, description, category, prep_time_minutes, cook_time_minutes, servings, image_url)
VALUES ('Caesar Salad', 'caesar-salad', 'Crispy romaine with creamy Caesar dressing', 'Salads', 15, 0, 2, NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO recipes (title, slug, description, category, prep_time_minutes, cook_time_minutes, servings, image_url)
VALUES ('Beef Tacos', 'beef-tacos', 'Seasoned ground beef in crispy tortillas', 'Mexican', 10, 20, 4, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Ingredients for Spaghetti Bolognese
INSERT INTO ingredients (recipe_id, name, quantity, unit)
SELECT r.id, 'Spaghetti', '400', 'g' FROM recipes r WHERE r.slug = 'spaghetti-bolognese'
AND NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.recipe_id = r.id AND i.name = 'Spaghetti');

INSERT INTO ingredients (recipe_id, name, quantity, unit)
SELECT r.id, 'Ground Beef', '500', 'g' FROM recipes r WHERE r.slug = 'spaghetti-bolognese'
AND NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.recipe_id = r.id AND i.name = 'Ground Beef');

INSERT INTO ingredients (recipe_id, name, quantity, unit)
SELECT r.id, 'Tomato Sauce', '2', 'cups' FROM recipes r WHERE r.slug = 'spaghetti-bolognese'
AND NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.recipe_id = r.id AND i.name = 'Tomato Sauce');

-- Instructions for Spaghetti Bolognese
INSERT INTO instructions (recipe_id, step_number, text)
SELECT r.id, 1, 'Boil water and cook spaghetti according to package directions' FROM recipes r WHERE r.slug = 'spaghetti-bolognese'
AND NOT EXISTS (SELECT 1 FROM instructions i WHERE i.recipe_id = r.id AND i.step_number = 1);

INSERT INTO instructions (recipe_id, step_number, text)
SELECT r.id, 2, 'Brown the ground beef in a large skillet' FROM recipes r WHERE r.slug = 'spaghetti-bolognese'
AND NOT EXISTS (SELECT 1 FROM instructions i WHERE i.recipe_id = r.id AND i.step_number = 2);

INSERT INTO instructions (recipe_id, step_number, text)
SELECT r.id, 3, 'Add tomato sauce and simmer for 20 minutes, then serve over pasta' FROM recipes r WHERE r.slug = 'spaghetti-bolognese'
AND NOT EXISTS (SELECT 1 FROM instructions i WHERE i.recipe_id = r.id AND i.step_number = 3);

-- Ingredients for Chicken Stir Fry
INSERT INTO ingredients (recipe_id, name, quantity, unit)
SELECT r.id, 'Chicken Breast', '300', 'g' FROM recipes r WHERE r.slug = 'chicken-stir-fry'
AND NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.recipe_id = r.id AND i.name = 'Chicken Breast');

INSERT INTO ingredients (recipe_id, name, quantity, unit)
SELECT r.id, 'Soy Sauce', '3', 'tbsp' FROM recipes r WHERE r.slug = 'chicken-stir-fry'
AND NOT EXISTS (SELECT 1 FROM ingredients i WHERE i.recipe_id = r.id AND i.name = 'Soy Sauce');

INSERT INTO instructions (recipe_id, step_number, text)
SELECT r.id, 1, 'Slice chicken and vegetables into thin strips' FROM recipes r WHERE r.slug = 'chicken-stir-fry'
AND NOT EXISTS (SELECT 1 FROM instructions i WHERE i.recipe_id = r.id AND i.step_number = 1);

INSERT INTO instructions (recipe_id, step_number, text)
SELECT r.id, 2, 'Stir fry chicken until golden, add vegetables and soy sauce, cook 5 more minutes' FROM recipes r WHERE r.slug = 'chicken-stir-fry'
AND NOT EXISTS (SELECT 1 FROM instructions i WHERE i.recipe_id = r.id AND i.step_number = 2);