import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Clock, Users, Filter, X, ChefHat, Flame, UtensilsCrossed, Leaf } from 'lucide-react';
import apiClient from '@/api/client';
import { Recipe } from '@/types';
import styles from '@/styles/recipes.module.css';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Salad', 'Soup'];

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.searchWrap}>
      <Search className={styles.searchIcon} size={16} />
      <input
        type="text"
        placeholder="Search recipes…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.searchInput}
      />
      {value && (
        <button onClick={() => onChange('')} className={styles.clearBtn}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function CategoryFilter({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.catWrap}>
      <Filter size={14} className={styles.catIcon} />
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c === 'All' ? '' : c)}
          className={`${styles.catBtn} ${(c === 'All' && !active) || c === active ? styles.catActive : ''}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function AddRecipeButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className={styles.addBtn}>
      <Plus size={16} /> Add Recipe
    </button>
  );
}

function RecipeGrid({ recipes, onSelect }: { recipes: Recipe[]; onSelect: (r: Recipe) => void }) {
  if (!recipes.length) {
    return (
      <div className={styles.empty}>
        <ChefHat size={48} strokeWidth={1.5} />
        <p>No recipes found</p>
        <span>Try adjusting your search or add a new recipe</span>
      </div>
    );
  }
  return (
    <div className={styles.grid}>
      <AnimatePresence mode="popLayout">
        {recipes.map((r) => (
          <motion.div
            key={r.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={styles.card}
            onClick={() => onSelect(r)}
          >
            <div className={styles.cardImg}>
              {r.image_url ? (
                <img src={r.image_url} alt={r.title} />
              ) : (
                <div className={styles.cardPlaceholder}>
                  <UtensilsCrossed size={32} strokeWidth={1.5} />
                </div>
              )}
              {r.category && <span className={styles.cardBadge}>{r.category}</span>}
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{r.title}</h3>
              {r.description && <p className={styles.cardDesc}>{r.description}</p>}
              <div className={styles.cardMeta}>
                {(r.prep_time_minutes || r.cook_time_minutes) && (
                  <span><Clock size={13} /> {(r.prep_time_minutes || 0) + (r.cook_time_minutes || 0)} min</span>
                )}
                {r.servings && <span><Users size={13} /> {r.servings}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FormState {
  title: string;
  description: string;
  category: string;
  prep_time_minutes: string;
  cook_time_minutes: string;
  servings: string;
  image_url: string;
  ingredients: { name: string; quantity: string; unit: string }[];
  instructions: { step_number: number; text: string }[];
}

const emptyForm: FormState = {
  title: '', description: '', category: '', prep_time_minutes: '', cook_time_minutes: '',
  servings: '', image_url: '',
  ingredients: [{ name: '', quantity: '', unit: '' }],
  instructions: [{ step_number: 1, text: '' }],
};

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<any>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await apiClient.get('/api/recipes', { params });
      setRecipes(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const openAdd = () => { setForm({ ...emptyForm }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/recipes', {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        prep_time_minutes: form.prep_time_minutes ? Number(form.prep_time_minutes) : undefined,
        cook_time_minutes: form.cook_time_minutes ? Number(form.cook_time_minutes) : undefined,
        servings: form.servings ? Number(form.servings) : undefined,
        image_url: form.image_url || undefined,
        ingredients: form.ingredients.filter((i) => i.name.trim()),
        instructions: form.instructions.filter((i) => i.text.trim()),
      });
      closeModal();
      fetchRecipes();
    } catch {
      setError('Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (r: Recipe) => {
    try {
      const { data } = await apiClient.get(`/api/recipes/${r.id}`);
      setDetailRecipe(data);
    } catch {
      setError('Failed to load recipe details');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/recipes/${id}`);
      setDetailRecipe(null);
      fetchRecipes();
    } catch {
      setError('Failed to delete recipe');
    }
  };

  // Stats
  const totalRecipes = recipes.length;
  const avgPrep = totalRecipes ? Math.round(recipes.reduce((a, r) => a + (r.prep_time_minutes || 0), 0) / totalRecipes) : 0;
  const avgCook = totalRecipes ? Math.round(recipes.reduce((a, r) => a + (r.cook_time_minutes || 0), 0) / totalRecipes) : 0;
  const cats = new Set(recipes.map((r) => r.category).filter(Boolean));

  return (
    <>
      <Head><title>Recipes — Savorra</title></Head>

      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.h1}>Recipe Library</h1>
            <p className={styles.sub}>{totalRecipes} recipes · {cats.size} categories</p>
          </div>
          <AddRecipeButton onClick={openAdd} />
        </div>

        {/* Stats */}
        <section className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statLabel}><UtensilsCrossed size={14} className={styles.iconEmerald} /> Total Recipes</div>
            <div className={styles.statVal}>{totalRecipes}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}><Flame size={14} className={styles.iconOrange} /> Avg Prep</div>
            <div className={styles.statVal}>{avgPrep}<span className={styles.statUnit}> min</span></div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}><Clock size={14} className={styles.iconSky} /> Avg Cook</div>
            <div className={styles.statVal}>{avgCook}<span className={styles.statUnit}> min</span></div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statLabel}><Leaf size={14} className={styles.iconLime} /> Categories</div>
            <div className={styles.statVal}>{cats.size}</div>
          </div>
        </section>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter active={category} onChange={setCategory} />
        </div>

        {/* Content */}
        {error && <div className={styles.error}>{error}</div>}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <RecipeGrid recipes={recipes} onSelect={openDetail} />
        )}
      </div>

      {/* Add Recipe Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className={styles.backdrop} onClick={closeModal} />
            <motion.div className={styles.modal} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
              <div className={styles.modalHead}>
                <h2>Add Recipe</h2>
                <button onClick={closeModal}><X size={18} /></button>
              </div>
              <div className={styles.modalBody}>
                <label className={styles.label}>Title *</label>
                <input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Recipe name" />

                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />

                <div className={styles.row2}>
                  <div>
                    <label className={styles.label}>Category</label>
                    <select className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">Select…</option>
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={styles.label}>Servings</label>
                    <input className={styles.input} type="number" min="1" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} />
                  </div>
                </div>

                <div className={styles.row2}>
                  <div>
                    <label className={styles.label}>Prep (min)</label>
                    <input className={styles.input} type="number" min="0" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} />
                  </div>
                  <div>
                    <label className={styles.label}>Cook (min)</label>
                    <input className={styles.input} type="number" min="0" value={form.cook_time_minutes} onChange={(e) => setForm({ ...form, cook_time_minutes: e.target.value })} />
                  </div>
                </div>

                <label className={styles.label}>Image URL</label>
                <input className={styles.input} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />

                {/* Ingredients */}
                <label className={styles.label}>Ingredients</label>
                {form.ingredients.map((ing, i) => (
                  <div key={i} className={styles.row3}>
                    <input className={styles.input} placeholder="Name" value={ing.name} onChange={(e) => { const arr = [...form.ingredients]; arr[i] = { ...arr[i], name: e.target.value }; setForm({ ...form, ingredients: arr }); }} />
                    <input className={styles.input} placeholder="Qty" value={ing.quantity} onChange={(e) => { const arr = [...form.ingredients]; arr[i] = { ...arr[i], quantity: e.target.value }; setForm({ ...form, ingredients: arr }); }} />
                    <input className={styles.input} placeholder="Unit" value={ing.unit} onChange={(e) => { const arr = [...form.ingredients]; arr[i] = { ...arr[i], unit: e.target.value }; setForm({ ...form, ingredients: arr }); }} />
                  </div>
                ))}
                <button className={styles.addSmall} onClick={() => setForm({ ...form, ingredients: [...form.ingredients, { name: '', quantity: '', unit: '' }] })}>+ Ingredient</button>

                {/* Instructions */}
                <label className={styles.label}>Instructions</label>
                {form.instructions.map((inst, i) => (
                  <div key={i} className={styles.stepRow}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <textarea className={styles.textarea} rows={1} value={inst.text} onChange={(e) => { const arr = [...form.instructions]; arr[i] = { ...arr[i], text: e.target.value }; setForm({ ...form, instructions: arr }); }} />
                  </div>
                ))}
                <button className={styles.addSmall} onClick={() => setForm({ ...form, instructions: [...form.instructions, { step_number: form.instructions.length + 1, text: '' }] })}>+ Step</button>
              </div>
              <div className={styles.modalFoot}>
                <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : 'Add Recipe'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {detailRecipe && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className={styles.backdrop} onClick={() => setDetailRecipe(null)} />
            <motion.div className={styles.drawer} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className={styles.drawerHead}>
                <div>
                  <h2>{detailRecipe.title}</h2>
                  {detailRecipe.category && <span className={styles.drawerBadge}>{detailRecipe.category}</span>}
                </div>
                <button onClick={() => setDetailRecipe(null)}><X size={20} /></button>
              </div>
              <div className={styles.drawerBody}>
                {detailRecipe.image_url && <img src={detailRecipe.image_url} alt="" className={styles.drawerImg} />}
                {detailRecipe.description && <p className={styles.drawerDesc}>{detailRecipe.description}</p>}
                <div className={styles.drawerMeta}>
                  {detailRecipe.prep_time_minutes != null && <span><Clock size={14} /> Prep: {detailRecipe.prep_time_minutes} min</span>}
                  {detailRecipe.cook_time_minutes != null && <span><Flame size={14} /> Cook: {detailRecipe.cook_time_minutes} min</span>}
                  {detailRecipe.servings != null && <span><Users size={14} /> Serves: {detailRecipe.servings}</span>}
                </div>

                {detailRecipe.ingredients?.length > 0 && (
                  <>
                    <h3 className={styles.drawerSection}>Ingredients</h3>
                    <ul className={styles.ingList}>
                      {detailRecipe.ingredients.map((ing: any) => (
                        <li key={ing.id}>{ing.quantity && `${ing.quantity} `}{ing.unit && `${ing.unit} `}{ing.name}</li>
                      ))}
                    </ul>
                  </>
                )}

                {detailRecipe.instructions?.length > 0 && (
                  <>
                    <h3 className={styles.drawerSection}>Instructions</h3>
                    <ol className={styles.instList}>
                      {detailRecipe.instructions.sort((a: any, b: any) => a.step_number - b.step_number).map((inst: any) => (
                        <li key={inst.id}>{inst.text}</li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
              <div className={styles.drawerFoot}>
                <button className={styles.deleteBtn} onClick={() => handleDelete(detailRecipe.id)}>Delete Recipe</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}