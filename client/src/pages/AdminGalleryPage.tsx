import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { galleryService } from '../services/api';
import type { GalleryCategory, GalleryItem } from '../types';

export default function AdminGalleryPage() {
  const [activeTab, setActiveTab] = useState<'fotos' | 'categorias'>('fotos');

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Forms
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{ id?: string, name: string }>({ name: '' });

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState<{ id?: string, url: string, categoryId: string, caption: string }>({ url: '', categoryId: '', caption: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resCat, resItems] = await Promise.all([
        galleryService.getCategories(true), // get all including inactive
        galleryService.getItems(undefined, true) // get all items
      ]);
      if (resCat.success) setCategories(resCat.data || []);
      if (resItems.success) setItems(resItems.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Load Cloudinary Widget script if not present
    if (!document.getElementById('cloudinary-widget-script')) {
      const script = document.createElement('script');
      script.id = 'cloudinary-widget-script';
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredItems = items.filter(item => {
    const captionMatch = item.caption?.toLowerCase().includes(search.toLowerCase());
    const categoryName = typeof item.categoryId === 'string' ? '' : (item.categoryId as any).name;
    const categoryMatch = categoryName?.toLowerCase().includes(search.toLowerCase());
    return captionMatch || categoryMatch;
  });

  // --- Categories ---
  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;
    try {
      if (categoryForm.id) {
        await galleryService.updateCategory(categoryForm.id, { name: categoryForm.name });
      } else {
        await galleryService.createCategory({ name: categoryForm.name });
      }
      setShowCategoryModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error guardando categoría');
    }
  };

  const handleToggleCategory = async (cat: GalleryCategory) => {
    try {
      await galleryService.updateCategory(cat._id, { isActive: !cat.isActive });
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error actualizando categoría');
    }
  };

  // --- Items ---
  const openCloudinary = () => {
    if (!(window as any).cloudinary) {
      alert('Cloudinary widget is not loaded yet. Please try again in a moment.');
      return;
    }
    const myWidget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: 'dz1gbtqnc',
        apiKey: '512765153651593',
        uploadPreset: 'salon_uploads',
        sources: ['local', 'camera', 'url'],
        multiple: false
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setItemForm(prev => ({ ...prev, url: result.info.secure_url }));
        } else if (error) {
          console.error("Detalle Error Cloudinary:", error);
        }
      }
    );
    myWidget.open();
  };

  const handleSaveItem = async () => {
    if (!itemForm.url || !itemForm.categoryId) return alert('URL y Categoría son obligatorias');
    try {
      if (itemForm.id) {
        await galleryService.updateItem(itemForm.id, { categoryId: itemForm.categoryId, caption: itemForm.caption, url: itemForm.url });
      } else {
        await galleryService.createItem({ url: itemForm.url, categoryId: itemForm.categoryId, caption: itemForm.caption });
      }
      setShowItemModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error guardando item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Eliminar esta foto permanentemente?')) return;
    try {
      await galleryService.deleteItem(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error eliminando foto');
    }
  };

  return (
    <AdminLayout 
      searchPlaceholder="Buscar por nombre, categoría o descripción..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '36px', color: T.primary }}>
              Galería Dinámica
            </h1>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant }}>
              Administra las fotos y categorías de tu portafolio
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: `1px solid ${T.outlineVariant}40`, paddingBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('fotos')}
            style={{ padding: '10px 24px', borderRadius: '9999px', border: 'none', backgroundColor: activeTab === 'fotos' ? T.surfaceContainerHighest : 'transparent', color: activeTab === 'fotos' ? T.onSurface : T.onSurfaceVariant, fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            🖼️ Fotos
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            style={{ padding: '10px 24px', borderRadius: '9999px', border: 'none', backgroundColor: activeTab === 'categorias' ? T.surfaceContainerHighest : 'transparent', color: activeTab === 'categorias' ? T.onSurface : T.onSurfaceVariant, fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            📁 Categorías
          </button>
        </div>

        {loading ? (
          <p style={{ fontFamily: T.fontBody }}>Cargando datos...</p>
        ) : (
          <>
            {/* VIEW CATEGORIES */}
            {activeTab === 'categorias' && (
              <div>
                <button
                  onClick={() => { setCategoryForm({ name: '' }); setShowCategoryModal(true); }}
                  style={{ marginBottom: '24px', padding: '12px 24px', backgroundColor: T.primary, color: 'white', borderRadius: '9999px', border: 'none', fontFamily: T.fontBody, fontWeight: 700, cursor: 'pointer' }}
                >
                  + Nueva Categoría
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredCategories.map(cat => (
                    <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: T.surfaceContainerLowest, borderRadius: '16px', border: `1px solid ${T.outlineVariant}40`, opacity: cat.isActive ? 1 : 0.6 }}>
                      <div>
                        <h4 style={{ fontFamily: T.fontBody, fontSize: '18px', fontWeight: 700, color: T.onSurface, marginBottom: '4px' }}>{cat.name}</h4>
                        <span style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, color: cat.isActive ? '#22c55e' : T.error }}>{cat.isActive ? 'ACTIVA' : 'INACTIVA'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => { setCategoryForm({ id: cat._id, name: cat.name }); setShowCategoryModal(true); }} style={{ padding: '8px 16px', borderRadius: '9999px', border: `1px solid ${T.outlineVariant}`, background: 'transparent', cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700 }}>Editar</button>
                        <button onClick={() => handleToggleCategory(cat)} style={{ padding: '8px 16px', borderRadius: '9999px', border: 'none', backgroundColor: cat.isActive ? T.errorContainer : T.secondaryContainer, color: cat.isActive ? T.error : T.onSecondaryContainer, cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700 }}>
                          {cat.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredCategories.length === 0 && <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant }}>{search ? 'Sin resultados para la búsqueda.' : 'No hay categorías registradas.'}</p>}
                </div>
              </div>
            )}

            {/* VIEW FOTOS */}
            {activeTab === 'fotos' && (
              <div>
                <button
                  onClick={() => { setItemForm({ url: '', categoryId: categories[0]?._id || '', caption: '' }); setShowItemModal(true); }}
                  style={{ marginBottom: '24px', padding: '12px 24px', backgroundColor: T.primary, color: 'white', borderRadius: '9999px', border: 'none', fontFamily: T.fontBody, fontWeight: 700, cursor: 'pointer' }}
                >
                  + Subir Foto
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {filteredItems.map(item => {
                    const catName = typeof item.categoryId === 'string' ? 'Cat' : (item.categoryId as any).name;
                    return (
                      <div key={item._id} style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${T.outlineVariant}40`, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
                          <img src={item.url} alt={item.caption} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ display: 'inline-block', fontFamily: T.fontBody, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer, padding: '4px 8px', borderRadius: '9999px', marginBottom: '8px' }}>
                              {catName}
                            </span>
                            <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface }}>{item.caption || 'Sin descripción'}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', paddingTop: '16px' }}>
                            <button onClick={() => { setItemForm({ id: item._id, url: item.url, categoryId: typeof item.categoryId === 'string' ? item.categoryId : (item.categoryId as any)._id, caption: item.caption || '' }); setShowItemModal(true); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, background: 'transparent', cursor: 'pointer', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700 }}>Editar</button>
                            <button onClick={() => handleDeleteItem(item._id)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: T.errorContainer, color: T.error, cursor: 'pointer', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700 }}>Eliminar</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {filteredItems.length === 0 && <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant }}>{search ? 'Sin resultados para la búsqueda.' : 'No hay fotos registradas.'}</p>}
              </div>
            )}
          </>
        )}

      </div>

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: T.surface, width: '400px', padding: '32px', borderRadius: '24px' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '24px' }}>
              {categoryForm.id ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, marginBottom: '6px' }}>Nombre de Categoría</label>
            <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Ej. Balayage, Manicure" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody }} />

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${T.outlineVariant}`, borderRadius: '9999px', background: 'none' }}>Cancelar</button>
              <button onClick={handleSaveCategory} style={{ flex: 1, padding: '12px', backgroundColor: T.primary, color: 'white', border: 'none', borderRadius: '9999px' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: T.surface, width: '400px', padding: '32px', borderRadius: '24px' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '24px', color: T.primary, marginBottom: '24px' }}>
              {itemForm.id ? 'Editar Foto' : 'Subir Foto'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                {itemForm.url ? (
                  <img src={itemForm.url} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '8px' }} />
                ) : (
                  <div style={{ width: '100%', height: '200px', backgroundColor: T.surfaceContainerHighest, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '32px', opacity: 0.5 }}>📷</span>
                  </div>
                )}
                <button onClick={openCloudinary} style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, padding: '8px 16px', borderRadius: '9999px', backgroundColor: T.secondaryContainer, color: T.onSecondaryContainer, border: 'none', cursor: 'pointer' }}>
                  {itemForm.url ? 'Cambiar Foto (Cloudinary)' : 'Seleccionar Foto (Cloudinary)'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, marginBottom: '6px' }}>Categoría</label>
                <select value={itemForm.categoryId} onChange={e => setItemForm({ ...itemForm, categoryId: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody }}>
                  <option value="">Selecciona una...</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, fontFamily: T.fontBody, marginBottom: '6px' }}>Descripción (Opcional)</label>
                <input type="text" value={itemForm.caption} onChange={e => setItemForm({ ...itemForm, caption: e.target.value })} placeholder="Ej. Cambio de look extremo" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${T.outlineVariant}`, fontFamily: T.fontBody }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setShowItemModal(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${T.outlineVariant}`, borderRadius: '9999px', background: 'none' }}>Cancelar</button>
              <button onClick={handleSaveItem} disabled={!itemForm.url || !itemForm.categoryId} style={{ flex: 1, padding: '12px', backgroundColor: (!itemForm.url || !itemForm.categoryId) ? T.outlineVariant : T.primary, color: 'white', border: 'none', borderRadius: '9999px' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
