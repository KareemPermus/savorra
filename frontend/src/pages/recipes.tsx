import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Clock, Users, X, Trash2, Edit, ChevronRight } from 'lucide-react';
import apiClient from '@/api/client';
import { Recipe } from '@/types';
import styles from '@/styles/recipes.module.css';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Appetizer'];

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [detailRecipe, setDetailRecipe] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: 'Dinner',
    prep_time_minutes: '', cook_time_minutes: '', servings: '', image_url: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    instructions: [{ step_number: 1, text: '' }],
  });

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/recipes');
      setRecipes(res.data);
    } catch { setError('Failed to load recipes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const filtered = recipes.filter(r => {
    const matchCat = category === 'All' || r.category === category;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'Dinner', prep_time_minutes: '', cook_time_minutes: '', servings: '', image_url: '', ingredients: [{ name: '', quantity: '', unit: '' }], instructions: [{ step_number: 1, text: '' }] });
    setEditingRecipe(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = async (r: Recipe) => {
    try {
      const res = await apiClient.get(`/api/recipes/${r.id}`);
      const d = res.data;
      setForm({
        title: d.title, description: d.description || '', category: d.category || 'Dinner',
        prep_time_minutes: d.prep_time_minutes?.toString() || '', cook_time_minutes: d.cook_time_minutes?.toString() || '',
        servings: d.servings?.toString() || '', image_url: d.image_url || '',
        ingredients: d.ingredients?.length ? d.ingredients.map((i: any) => ({ name: i.name, quantity: i.quantity || '', unit: i.unit || '' })) : [{ name: '', quantity: '', unit: '' }],
        instructions: d.instructions?.length ? d.instructions.map((i: any) => ({ step_number: i.step_number, text: i.text })) : [{ step_number: 1, text: '' }],
      });
      setEditingRecipe(d);
      setShowModal(true);
    } catch { setError('Failed to load recipe'); }
  };

  const openDetail = async (r: Recipe) => {
    try {
      const res = await apiClient.get(`/api/recipes/${r.id}`);
      setDetailRecipe(res.data);
      setShowDrawer(true);
    } catch { setError('Failed to load recipe details'); }
  };

  const handleSubmit = async () => {
    const body = {
      ...form,
      prep_time_minutes: form.prep_time_minutes ? parseInt(form.prep_time_minutes) : null,
      cook_time_minutes: form.cook_time_minutes ? parseInt(form.cook_time_minutes) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      ingredients: form.ingredients.filter(i => i.name.trim()),
      instructions: form.instructions.filter(i => i.text.trim()).map((i, idx) => ({ ...i, step_number: idx + 1 })),
    };
    try {
      if (editingRecipe) {
        await apiClient.put(`/api/recipes/${editingRecipe.id}`, body);
      } else {
        await apiClient.post('/api/recipes', body);
      }
      setShowModal(false);
      resetForm();
      fetchRecipes();
    } catch { setError('Failed to save recipe'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this recipe?')) return;
    try {
      await apiClient.delete(`/api/recipes/${id}`);
      setShowDrawer(false);
      fetchRecipes();
    } catch { setError('Failed to delete'); }
  };

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', quantity: '', unit: '' }] }));
  const removeIngredient = (idx: number) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  const updateIngredient = (idx: number, field: string, val: string) => setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [field]: val } : ing) }));

  const addInstruction = () => setForm(f => ({ ...f, instructions: [...f.instructions, { step_number: f.instructions.length + 1, text: '' }] }));
  const removeInstruction = (idx: number) => setForm(f => ({ ...f, instructions: f.instructions.filter((_, i) => i !== idx) }));
  const updateInstruction = (idx: number, val: string) => setForm(f => ({ ...f, instructions: f.instructions.map((ins, i) => i === idx ? { ...ins, text: val } : ins) }));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recipes</h1>
          <p className={styles.subtitle}>{filtered.length} recipe{filtered.length !== 1 ? 's' : ''} in your library</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <Plus size={16} /> Add Recipe
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search recipes…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.categories}>
          {CATEGORIES.map(c => (
            <button key={c} className={`${styles.catBtn} ${category === c ? styles.catActive : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>Loading recipes…</div>
      ) : error ? (
        <div className={styles.errorState}>{error}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>No recipes found. Add your first recipe!</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(r => (
            <div key={r.id} className={styles.card} onClick={() => openDetail(r)}>
              <div className={styles.cardImage} style={{ backgroundImage: r.image_url ? `url(${r.image_url})` : undefined }}>
                {!r.image_url && <span className={styles.cardImagePlaceholder}>🍽</span>}
                {r.category && <span className={styles.cardBadge}>{r.category}</span>}
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{r.title}</h3>
                {r.description && <p className={styles.cardDesc}>{r.description}</p>}
                <div className={styles.cardMeta}>
                  {r.prep_time_minutes != null && (
                    <span className={styles.metaItem}><Clock size={13} /> {r.prep_time_minutes}m prep</span>
                  )}
                  {r.cook_time_minutes != null && (
                    <span className={styles.metaItem}><Clock size={13} /> {r.cook_time_minutes}m cook</span>
                  )}
                  {r.servings != null && (
                    <span className={styles.metaItem}><Users size={13} /> {r.servings}</span>
                  )}
                </div>
              </div>
              <button className={styles.cardArrow}><ChevronRight size={18} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      {showDrawer && detailRecipe && (
        <div className={styles.drawerBackdrop} onClick={() => setShowDrawer(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h2 className={styles.drawerTitle}>{detailRecipe.title}</h2>
                {detailRecipe.category && <span className={styles.drawerBadge}>{detailRecipe.category}</span>}
              </div>
              <button className={styles.drawerClose} onClick={() => setShowDrawer(false)}><X size={20} /></button>
            </div>
            <div className={styles.drawerBody}>
              {detailRecipe.description && <p className={styles.drawerDesc}>{detailRecipe.description}</p>}
              <div className={styles.drawerMetaRow}>
                {detailRecipe.prep_time_minutes != null && <div className={styles.drawerMeta}><Clock size={14} /> {detailRecipe.prep_time_minutes}m prep</div>}
                {detailRecipe.cook_time_minutes != null && <div className={styles.drawerMeta}><Clock size={14} /> {detailRecipe.cook_time_minutes}m cook</div>}
                {detailRecipe.servings != null && <div className={styles.drawerMeta}><Users size={14} /> {detailRecipe.servings} servings</div>}
              </div>

              {detailRecipe.ingredients?.length > 0 && (
                <div className={styles.drawerSection}>
                  <h3 className={styles.drawerSectionTitle}>Ingredients</h3>
                  <ul className={styles.ingredientList}>
                    {detailRecipe.ingredients.map((ing: any) => (
                      <li key={ing.id}>{ing.quantity} {ing.unit} {ing.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {detailRecipe.instructions?.length > 0 && (
                <div className={styles.drawerSection}>
                  <h3 className={styles.drawerSectionTitle}>Instructions</h3>
                  <ol className={styles.instructionList}>
                    {detailRecipe.instructions.sort((a: any, b: any) => a.step_number - b.step_number).map((ins: any) => (
                      <li key={ins.id}>{ins.text}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className={styles.drawerActions}>
                <button className={styles.editBtn} onClick={() => { setShowDrawer(false); openEdit(detailRecipe); }}><Edit size={14} /> Edit</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(detailRecipe.id)}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingRecipe ? 'Edit Recipe' : 'Add Recipe'}</h2>
              <button onClick={() => setShowModal(false)} className={styles.drawerClose}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Title *</label>
                <input className={styles.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select className={styles.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Servings</label>
                  <input className={styles.input} type="number" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Prep (min)</label>
                  <input className={styles.input} type="number" value={form.prep_time_minutes} onChange={e => setForm(f => ({ ...f, prep_time_minutes: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cook (min)</label>
                  <input className={styles.input} type="number" value={form.cook_time_minutes} onChange={e => setForm(f => ({ ...f, cook_time_minutes: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Image URL</label>
                <input className={styles.input} value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              </div>

              {/* Ingredients */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Ingredients</label>
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} className={styles.ingredientRow}>
                    <input className={styles.inputSm} placeholder="Name" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} />
                    <input className={styles.inputXs} placeholder="Qty" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} />
                    <input className={styles.inputXs} placeholder="Unit" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} />
                    <button className={styles.removeBtn} onClick={() => removeIngredient(idx)}><X size={14} /></button>
                  </div>
                ))}
                <button className={styles.addSmBtn} onClick={addIngredient}><Plus size={14} /> Add Ingredient</button>
              </div>

              {/* Instructions */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Instructions</label>
                {form.instructions.map((ins, idx) => (
                  <div key={idx} className={styles.instructionRow}>
                    <span className={styles.stepNum}>{idx + 1}.</span>
                    <input className={styles.inputFull} placeholder="Step description" value={ins.text} onChange={e => updateInstruction(idx, e.target.value)} />
                    <button className={styles.removeBtn} onClick={() => removeInstruction(idx)}><X size={14} /></button>
                  </div>
                ))}
                <button className={styles.addSmBtn} onClick={addInstruction}><Plus size={14} /> Add Step</button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={!form.title.trim()}>
                {editingRecipe ? 'Update' : 'Add'} Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}