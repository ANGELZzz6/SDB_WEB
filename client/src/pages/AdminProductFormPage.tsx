import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { productService } from '../services/api';
import type { Product } from '../types';

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    nombre: '', marca: 'Velvet & Bloom', sku: '', descripcion: '', categoria: '',
    imagenes: [], ingredientes: [], beneficios: [],
    precio: undefined, precioOferta: undefined, costo: undefined,
    stock: undefined, stockMinimo: 15, rastrearStock: true,
    seoTitle: '', seoDesc: '', destacadoEnHome: false,
  });

  const [categorias, setCategorias] = useState<string[]>([]);
  const [isNewCategory, setIsNewCategory] = useState(false);

  const [ingredientesStr, setIngredientesStr] = useState('');
  const [beneficiosStr, setBeneficiosStr] = useState('');

  useEffect(() => {
    // Cargar categorías existentes
    productService.getCategorias().then(res => {
      if (res.success && res.data) {
        setCategorias(res.data);
      }
    });

    if (id) {
      productService.getById(id).then(res => {
        if (res.success && res.data) {
          setFormData(res.data);
          setIngredientesStr((res.data.ingredientes || []).join(', '));
          setBeneficiosStr((res.data.beneficios || []).join(', '));
        }
        setLoading(false);
      }).catch(() => {
        alert('Error cargando producto');
        navigate('/admin/productos');
      });
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'number') {
      finalValue = value === '' ? undefined : Number(value);
    }
    if (type === 'checkbox') finalValue = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos
    const missingFields: string[] = [];
    if (!formData.nombre || !formData.nombre.trim()) {
      missingFields.push('Nombre del Producto');
    }
    if (!formData.sku || !formData.sku.trim()) {
      missingFields.push('SKU');
    }
    if (!formData.categoria || !formData.categoria.trim()) {
      missingFields.push('Categoría');
    }
    if (formData.precio === undefined || formData.precio === null || (formData.precio as any) === '') {
      missingFields.push('Precio Regular');
    }
    if (formData.rastrearStock) {
      if (formData.stock === undefined || formData.stock === null || (formData.stock as any) === '') {
        missingFields.push('Stock Inicial');
      }
    }

    if (missingFields.length > 0) {
      alert(`Por favor, complete los siguientes campos obligatorios:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setSaving(true);
    try {
      const cleanNumber = (val: any) => {
        if (val === undefined || val === null || val === '' || val === 0) return null;
        return Number(val);
      };

      const dataToSave = {
        ...formData,
        ingredientes: ingredientesStr.split(',').map(s => s.trim()).filter(Boolean),
        beneficios: beneficiosStr.split(',').map(s => s.trim()).filter(Boolean),
        precio: formData.precio !== undefined && (formData.precio as any) !== '' ? Number(formData.precio) : undefined,
        precioOferta: cleanNumber(formData.precioOferta),
        costo: cleanNumber(formData.costo),
        stock: formData.rastrearStock && formData.stock !== undefined && (formData.stock as any) !== '' ? Number(formData.stock) : 0,
        stockMinimo: formData.rastrearStock ? cleanNumber(formData.stockMinimo) : null,
      };

      if (id) {
        await productService.update(id, dataToSave as any);
      } else {
        await productService.create(dataToSave as any);
      }
      navigate('/admin/productos');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const openCloudinary = () => {
    if (!(window as any).cloudinary) {
      alert('El widget de carga no se ha cargado. Por favor espera.');
      return;
    }
    const widget = (window as any).cloudinary.createUploadWidget(
      { cloudName: 'dz1gbtqnc', uploadPreset: 'salon_uploads', sources: ['local', 'camera', 'url'], multiple: false },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          setFormData(prev => ({ ...prev, imagenes: [result.info.secure_url] }));
        }
      }
    );
    widget.open();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '64px', textAlign: 'center', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>
          Cargando producto...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout searchPlaceholder="Buscar en formulario...">
      <style>{`
        .ghost-input {
          background-color: transparent !important;
          border: none !important;
          border-bottom: 1px solid ${T.outlineVariant}50 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          transition: border-color 0.2s ease;
          width: 100%;
          padding: 8px 0;
          font-family: ${T.fontBody};
          font-size: 16px;
          color: ${T.onSurface};
          outline: none;
        }
        .ghost-input:focus {
          border-bottom: 2px solid ${T.primary} !important;
        }
        .form-section {
          background-color: ${T.surfaceContainerLow};
          border-radius: 24px;
          padding: 32px;
          border: 1px solid ${T.outlineVariant}30;
          margin-bottom: 32px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 1024px) {
          .form-grid {
            grid-template-columns: 7fr 5fr;
          }
        }
        @media (max-width: 768px) {
          .admin-form-container { padding: 24px 16px 140px !important; }
        }
        .form-grid-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 640px) {
          .form-grid-row {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="admin-form-container" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header con acciones */}
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: T.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: '4px',
                  marginBottom: '8px', padding: 0
                }}
              >
                <span>⬅</span> Volver
              </button>
              <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(24px, 5vw, 36px)', color: T.primary, fontWeight: 700, margin: 0 }}>
                {id ? 'Editar Producto' : 'Crear Producto'}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  backgroundColor: 'transparent', color: T.onSurfaceVariant,
                  border: `1px solid ${T.outlineVariant}`, padding: '12px 24px', borderRadius: '9999px',
                  fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: T.primary, color: '#fff',
                  border: 'none', padding: '12px 32px', borderRadius: '9999px',
                  fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 6px 20px rgba(148,69,85,0.30)`,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </div>

          <div className="form-grid">

            {/* Columna Izquierda (Datos Básicos, Imágenes, Ingredientes) */}
            <div>
              {/* Información básica */}
              <div className="form-section">
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginTop: 0, marginBottom: '24px' }}>Información Básica</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  <div className="form-grid-row">
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Nombre del Producto *</label>
                      <input required name="nombre" value={formData.nombre || ''} onChange={handleChange} className="ghost-input" placeholder="Ej: Serum Renovador Celular" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Marca</label>
                      <input name="marca" value={formData.marca || ''} onChange={handleChange} className="ghost-input" />
                    </div>
                  </div>

                  <div className="form-grid-row">

                    {/* Category Selector with Prevent Duplicates logic */}
                    <div>
                      {isNewCategory ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Nueva Categoría *</label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsNewCategory(false);
                                setFormData(prev => ({ ...prev, categoria: categorias[0] || '' }));
                              }}
                              style={{ background: 'none', border: 'none', color: T.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Seleccionar existente
                            </button>
                          </div>
                          <input
                            required
                            type="text"
                            placeholder="Ej: Cuidado Capilar"
                            value={formData.categoria || ''}
                            onChange={e => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                            className="ghost-input"
                          />
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Categoría *</label>
                          <select
                            value={formData.categoria || ''}
                            onChange={e => {
                              if (e.target.value === 'nueva') {
                                setIsNewCategory(true);
                                setFormData(prev => ({ ...prev, categoria: '' }));
                              } else {
                                setFormData(prev => ({ ...prev, categoria: e.target.value }));
                              }
                            }}
                            className="ghost-input"
                            style={{ cursor: 'pointer' }}
                          >
                            <option value="" disabled>Selecciona una categoría</option>
                            {categorias.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="nueva" style={{ fontWeight: 'bold', color: T.primary }}>➕ Crear nueva categoría...</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>SKU * {id && <span style={{ textTransform: 'lowercase', fontWeight: 400, color: '#e2725b' }}>(no editable)</span>}</label>
                      <input required name="sku" value={formData.sku || ''} onChange={handleChange} disabled={!!id} className="ghost-input" placeholder="LUM-SER-001" style={{ textTransform: 'uppercase' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Descripción Larga</label>
                    <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows={4} className="ghost-input" style={{ resize: 'none' }} placeholder="Escribe detalles sobre la formulación y uso..." />
                  </div>

                </div>
              </div>

              {/* Multimedia */}
              <div className="form-section" style={{ backgroundColor: T.surfaceContainerLowest }}>
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginTop: 0, marginBottom: '8px' }}>Multimedia</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, marginBottom: '24px', lineHeight: 1.5 }}>
                  💡 <strong>Tamaño recomendado:</strong> Para que la imagen se muestre correctamente en la tienda (sin recortar o deformar), usa una relación de aspecto de <strong>4:5</strong> (por ejemplo: 800 x 1000 px, o mínimo 400 x 500 px).
                </p>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    onClick={openCloudinary}
                    style={{
                      width: '140px', height: '140px', borderRadius: '16px',
                      border: `2px dashed ${T.outlineVariant}`, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                      backgroundColor: T.surfaceContainerLow, color: T.onSurfaceVariant
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>📷</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Subir Imagen</span>
                  </div>

                  {formData.imagenes && formData.imagenes.length > 0 ? (
                    <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${T.outlineVariant}50` }}>
                      <img src={formData.imagenes[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, imagenes: [] }))}
                        style={{
                          position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px',
                          borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: '140px', height: '140px', borderRadius: '16px', backgroundColor: T.surfaceContainerLow, border: `1px solid ${T.outlineVariant}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.onSurfaceVariant, fontSize: '13px' }}>Sin imagen</div>
                  )}
                </div>
              </div>

              {/* Tratamiento / Ingredientes */}
              <div className="form-section">
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginTop: 0, marginBottom: '24px' }}>Detalles de Tratamiento</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Ingredientes Clave (separados por coma)</label>
                    <textarea value={ingredientesStr} onChange={e => setIngredientesStr(e.target.value)} rows={2} className="ghost-input" style={{ resize: 'none' }} placeholder="Ácido Hialurónico, Vitamina C, Péptidos..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Beneficios Clave (separados por coma)</label>
                    <textarea value={beneficiosStr} onChange={e => setBeneficiosStr(e.target.value)} rows={2} className="ghost-input" style={{ resize: 'none' }} placeholder="Hidratación 24h, Brillo natural, Elasticidad..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha (Precios, Inventario, SEO) */}
            <div>
              {/* Precios */}
              <div className="form-section" style={{ backgroundColor: T.surfaceContainerLowest }}>
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginTop: 0, marginBottom: '24px' }}>Estructura de Precios</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Precio Regular ($) *</label>
                    <input required type="number" name="precio" min="0" value={formData.precio ?? ''} onChange={handleChange} className="ghost-input" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Precio de Oferta ($) <span style={{ textTransform: 'lowercase', fontWeight: 400, color: T.onSurfaceVariant }}>(vacío para omitir)</span></label>
                    <input type="number" name="precioOferta" min="0" value={formData.precioOferta ?? ''} onChange={handleChange} className="ghost-input" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Costo Base ($) <span style={{ textTransform: 'lowercase', fontWeight: 400, color: T.onSurfaceVariant }}>(Privado para admin)</span></label>
                    <input type="number" name="costo" min="0" value={formData.costo ?? ''} onChange={handleChange} className="ghost-input" />
                  </div>
                </div>
              </div>

              {/* Inventario */}
              <div className="form-section">
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginTop: 0, marginBottom: '24px' }}>Control de Inventario</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" name="rastrearStock" checked={formData.rastrearStock} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: T.primary }} />
                    <span style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface }}>Rastrear inventario de este producto</span>
                  </label>

                  {formData.rastrearStock && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Stock Inicial *</label>
                        <input required type="number" name="stock" min="0" value={formData.stock ?? ''} onChange={handleChange} className="ghost-input" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Mínimo Crítico</label>
                        <input type="number" name="stockMinimo" min="0" value={formData.stockMinimo ?? ''} onChange={handleChange} className="ghost-input" />
                      </div>
                    </div>
                  )}

                  {/* Destacar en página principal */}
                  <div style={{
                    padding: '16px', borderRadius: '16px',
                    border: `1.5px solid ${formData.destacadoEnHome ? T.primary : T.outlineVariant}30`,
                    backgroundColor: formData.destacadoEnHome ? `${T.primaryFixed}60` : 'transparent',
                    transition: 'all 0.25s ease',
                  }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="destacadoEnHome"
                        checked={!!formData.destacadoEnHome}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px', accentColor: T.primary, flexShrink: 0, marginTop: '2px' }}
                      />
                      <div>
                        <span style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.onSurface, display: 'block' }}>
                          ⭐ Destacar en página principal
                        </span>
                        <span style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, lineHeight: 1.5, display: 'block', marginTop: '2px' }}>
                          Este producto aparecerá en el carrusel de destacados del inicio. Ideal para productos en oferta o productos estrella.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO & Meta */}
              <div className="form-section">
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginTop: 0, marginBottom: '24px' }}>SEO & Meta Tags</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Meta Título</label>
                    <input name="seoTitle" value={formData.seoTitle || ''} onChange={handleChange} className="ghost-input" placeholder="Ej: Serum Regenerador | Ethereal Apothecary" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, fontFamily: T.fontBody, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Meta Descripción</label>
                    <textarea name="seoDesc" value={formData.seoDesc || ''} onChange={handleChange} rows={2} className="ghost-input" style={{ resize: 'none' }} placeholder="Resumen corto de los beneficios para resultados de buscadores..." />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
