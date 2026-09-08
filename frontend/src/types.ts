export interface Recipe {
  id: number;
  title: string;
  description?: string;
  category?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  image_url?: string;
  created_at: string;
}

export interface Ingredient {
  id: number;
  recipe_id: number;
  name: string;
  quantity?: string;
  unit?: string;
}

export interface Instruction {
  id: number;
  recipe_id: number;
  step_number: number;
  text: string;
}

export interface RecipeDetail extends Recipe {
  ingredients: Ingredient[];
  instructions: Instruction[];
}

export interface DeleteResponse {
  message: string;
}