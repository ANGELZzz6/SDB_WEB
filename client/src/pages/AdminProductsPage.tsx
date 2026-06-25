import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { productService } from '../services/api';
import type { Product } from '../types';

// Modal de confirmacion premium
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningText?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmDeleteModal({ isOpen, title, message, warningText, confirmLabel = 'Eliminar', onConfirm, onCancel, loading }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(28, 27, 26, 0.55)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: T.surfaceContainerLowest,
        borderRadius: '24px',
        padding: '36px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 32px 64px rgba(148,69,85,0.18)',
        border: `1px solid ${T.outlineVariant}30`,
        animation: 'modalIn 0.25s ease-out',
      }}>
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.94) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          backgroundColor: `${T.error}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', marginBottom: '20px'
        }}>🗑️</div>
        <h2 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.onSurface, margin: '0 0 10px' }}>
          {title}
        </h2>
        <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, margin: '0 0 16px', lineHeight: 1.7 }}>
          {message}
        </p>
        {warningText && (
          <div style={{
            backgroundColor: `${T.error}10`,
            border: `1px solid ${T.error}25`,
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
          }}>
            <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.error, margin: 0, fontWeight: 600 }}>
              ⚠️ {warningText}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              border: `1px solid ${T.outlineVariant}60`, background: 'none',
              padding: '10px 20px', borderRadius: '9999px',
              fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600,
              color: T.onSurfaceVariant, cursor: 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              backgroundColor: T.error, color: '#fff',
              border: 'none', padding: '10px 20px', borderRadius: '9999px',
              fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 12px ${T.error}35`,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: Product | null; deleting: boolean }>({ open: false, product: null, deleting: false });
  const [deleteCatModal, setDeleteCatModal] = useState<{ open: boolean; nombre: string; deleting: boolean }>({ open: false, nombre: '', deleting: false });
  const [activeTab, setActiveTab] = useState<'productos' | 'categorias'>('productos');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      productService.getAll({ search: debouncedSearch, includeInactive: true }),
      productService.getCategorias(),
    ]).then(([res, resCat]) => {
      if (res.success && res.data) {
        setProducts(res.data);
        if (res.stats) setStats(res.stats);
      }
      if (resCat.success && resCat.data) {
        setCategorias(resCat.data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleStatus = async (p: Product) => {
    if (!window.confirm(`¿Seguro que deseas ${p.isActive ? 'desactivar' : 'reactivar'} el producto ${p.nombre}?`)) return;
    try {
      if (p.isActive) { await productService.deactivate(p._id); }
      else { await productService.reactivate(p._id); }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteModal.product) return;
    setDeleteModal(m => ({ ...m, deleting: true }));
    try {
      await productService.hardDelete(deleteModal.product._id);
      setDeleteModal({ open: false, product: null, deleting: false });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
      setDeleteModal(m => ({ ...m, deleting: false }));
    }
  };

  const handleDeleteCategoria = async () => {
    if (!deleteCatModal.nombre) return;
    setDeleteCatModal(m => ({ ...m, deleting: true }));
    try {
      const res = await productService.deleteCategoria(deleteCatModal.nombre);
      const msg = (res as any).message || 'Categoria eliminada correctamente.';
      alert(msg);
      setDeleteCatModal({ open: false, nombre: '', deleting: false });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar categoria');
      setDeleteCatModal(m => ({ ...m, deleting: false }));
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
  const productosPorCategoria = (cat: string) => products.filter(p => p.categoria === cat).length;

  return (
    <AdminLayout searchPlaceholder="Buscar producto por SKU, nombre, marca..." searchValue={search} onSearchChange={setSearch}>
      <style>{`
        .ghost-input { border: none !important; border-bottom: 1px solid ${T.outlineVariant}50 !important; background: transparent !important; border-radius: 0 !important; outline: none !important; box-shadow: none !important; transition: all 0.3s ease; }
        .ghost-input:focus { border-bottom: 2px solid ${T.primary} !important; }
        .soft-shadow { box-shadow: 0 20px 40px rgba(62, 2, 21, 0.02); }
        .tab-btn { padding: 10px 22px; border-radius: 9999px; border: none; font-family: ${T.fontBody}; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.08em; }
        .tab-btn.active { background-color: ${T.primary}; color: #fff; box-shadow: 0 4px 12px rgba(148,69,85,0.25); }
        .tab-btn.inactive { background-color: ${T.surfaceContainerHigh}; color: ${T.onSurfaceVariant}; }
        .tab-btn.inactive:hover { background-color: ${T.outlineVariant}; }
        .cat-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid ${T.outlineVariant}15; }
        .cat-row:last-child { border-bottom: none; }
        .delete-btn { border: 1px solid ${T.error}35; background: none; color: ${T.error}; padding: 5px 11px; border-radius: 9999px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: ${T.fontBody}; transition: background 0.15s; white-space: nowrap; }
        .delete-btn:hover { background-color: ${T.error}10; }
        .md-block { display: block !important; }
        .mobile-block { display: none !important; }
        @media (max-width: 768px) {
          .admin-prod-container { padding: 24px 16px 120px !important; }
          .md-block { display: none !important; }
          .mobile-block { display: block !important; }
        }
      `}</style>

      <ConfirmDeleteModal
        isOpen={deleteModal.open}
        title="Eliminar producto permanentemente"
        message={`¿Estás segura de que deseas eliminar "${deleteModal.product?.nombre}" del catálogo? Esta acción no se puede deshacer.`}
        warningText="Se eliminarán también todos los movimientos de inventario asociados a este producto."
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteModal({ open: false, product: null, deleting: false })}
        loading={deleteModal.deleting}
      />
      <ConfirmDeleteModal
        isOpen={deleteCatModal.open}
        title={`Eliminar categoría "${deleteCatModal.nombre}"`}
        message={`Los ${productosPorCategoria(deleteCatModal.nombre)} productos de esta categoría serán reasignados a "Sin Categoría". La categoría desaparecerá del catálogo.`}
        warningText="Los productos no se eliminan, solo se reasignan. Podrás editarlos después para asignarles otra categoría."
        confirmLabel="Eliminar categoría"
        onConfirm={handleDeleteCategoria}
        onCancel={() => setDeleteCatModal({ open: false, nombre: '', deleting: false })}
        loading={deleteCatModal.deleting}
      />

      <div className="admin-prod-container" style={{ padding: '40px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(28px, 5vw, 40px)', color: T.primary, fontWeight: 700, margin: 0 }}>
              Colección Curada
            </h1>
            <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurfaceVariant, marginTop: '4px' }}>
              Gestión de inventario y catálogo premium de productos. <span style={{ fontWeight: 600, color: T.primary }}>{products.length} en total</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/productos/nuevo')}
            style={{ backgroundColor: T.primary, color: '#ffffff', padding: '14px 28px', borderRadius: '9999px', fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', border: 'none', cursor: 'pointer', boxShadow: `0 6px 20px rgba(148,69,85,0.30)`, display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>➕</span> Nuevo Producto
          </button>
        </div>

        {/* Stats Bento */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30` }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Total Productos</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: T.onSurface, margin: 0 }}>{stats.totalProductos}</p>
                <span style={{ fontSize: '24px' }}>📦</span>
              </div>
            </div>
            <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30` }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Valor Inventario</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: T.primary, margin: 0 }}>{formatCurrency(stats.valorInventario)}</p>
                <span style={{ fontSize: '24px' }}>💰</span>
              </div>
            </div>
            <div style={{ backgroundColor: T.surfaceContainerLow, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30` }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Stock Bajo</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: '#e2725b', margin: 0 }}>{stats.stockBajo}</p>
                <span style={{ fontSize: '24px' }}>⚠️</span>
              </div>
            </div>
            <div style={{ backgroundColor: T.surfaceContainerLow, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30` }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Agotados</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: T.error, margin: 0 }}>{stats.agotados}</p>
                <span style={{ fontSize: '24px' }}>🚨</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          <button className={`tab-btn ${activeTab === 'productos' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('productos')}>📦 Productos</button>
          <button className={`tab-btn ${activeTab === 'categorias' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('categorias')}>🏷️ Categorías</button>
        </div>

        {/* Vista: Catálogo */}
        {activeTab === 'productos' && (
          <div className="soft-shadow" style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '20px', padding: '32px', border: `1px solid ${T.outlineVariant}20` }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.onSurface, margin: '0 0 24px' }}>Catálogo Principal</h3>
            {loading ? (
              <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', padding: '40px' }}>Cargando catálogo...</p>
            ) : products.length === 0 ? (
              <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', padding: '40px' }}>No hay productos registrados.</p>
            ) : (
              <>
                {/* Desktop */}
                <div className="md-block" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.outlineVariant}30` }}>
                        {['Producto','SKU','Categoría / Marca','Precio','Stock','Estado',''].map((h, i) => (
                          <th key={i} style={{ paddingBottom: '16px', fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, textAlign: i >= 3 && i <= 5 ? 'right' : i === 6 ? 'right' : 'left', width: i === 6 ? '180px' : undefined }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const isLow = p.rastrearStock && p.stock > 0 && p.stock <= p.stockMinimo;
                        const isOut = p.rastrearStock && p.stock === 0;
                        return (
                          <tr key={p._id} style={{ borderBottom: `1px solid ${T.outlineVariant}15` }}>
                            <td style={{ padding: '20px 12px 20px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img src={p.imagenes?.[0] || 'https://via.placeholder.com/80'} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', backgroundColor: T.surfaceContainerLow }} />
                                <span style={{ fontFamily: T.fontBody, fontWeight: 700, fontSize: '15px', color: T.onSurface }}>{p.nombre}</span>
                              </div>
                            </td>
                            <td style={{ padding: '20px 8px', fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant }}>{p.sku}</td>
                            <td style={{ padding: '20px 8px' }}>
                              <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurface, margin: 0 }}>{p.categoria}</p>
                              <p style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant, margin: 0 }}>{p.marca}</p>
                            </td>
                            <td style={{ padding: '20px 8px', fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.onSurface, textAlign: 'right' }}>
                              {formatCurrency(p.precioOferta && p.precioOferta > 0 ? p.precioOferta : p.precio)}
                            </td>
                            <td style={{ padding: '20px 8px', textAlign: 'right' }}>
                              <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600, color: isOut ? T.error : isLow ? '#e2725b' : '#2e7d32' }}>
                                {p.rastrearStock ? `${p.stock} un.` : 'Ilimitado'}
                              </span>
                            </td>
                            <td style={{ padding: '20px 8px', textAlign: 'center' }}>
                              <button onClick={() => toggleStatus(p)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: p.isActive ? '#e2f0d9' : T.surfaceContainerHigh, color: p.isActive ? '#2e7d32' : T.onSurfaceVariant }}>
                                {p.isActive ? 'Activo' : 'Pausado'}
                              </button>
                            </td>
                            <td style={{ padding: '20px 0', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button onClick={() => navigate(`/admin/productos/${p._id}`)} style={{ border: `1px solid ${T.outlineVariant}`, background: 'none', padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, color: T.onSurface, cursor: 'pointer' }}>Ver</button>
                                <button onClick={() => navigate(`/admin/productos/editar/${p._id}`)} style={{ border: 'none', backgroundColor: T.primaryFixed, padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, color: T.primary, cursor: 'pointer' }}>Editar</button>
                                <button className="delete-btn" onClick={() => setDeleteModal({ open: true, product: p, deleting: false })} title="Eliminar permanentemente">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="mobile-block">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {products.map(p => {
                      const isOut = p.rastrearStock && p.stock === 0;
                      return (
                        <div key={p._id} style={{ padding: '16px', borderRadius: '16px', backgroundColor: T.surfaceContainerLow, border: `1px solid ${T.outlineVariant}30` }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <img src={p.imagenes?.[0] || 'https://via.placeholder.com/80'} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h4 style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 700, color: T.onSurface, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.nombre}</h4>
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: p.isActive ? '#e2f0d9' : T.surfaceVariant, color: p.isActive ? '#2e7d32' : T.onSurfaceVariant }}>{p.isActive ? 'Activo' : 'Pausado'}</span>
                              </div>
                              <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, margin: '2px 0 6px' }}>{p.sku} • {p.marca}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 600, color: T.primary }}>{formatCurrency(p.precioOferta || p.precio)}</span>
                                <span style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 600, color: isOut ? T.error : T.onSurface }}>Stock: {p.rastrearStock ? p.stock : '∞'}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button onClick={() => navigate(`/admin/productos/${p._id}`)} style={{ flex: 1, border: `1px solid ${T.outlineVariant}40`, backgroundColor: '#fff', padding: '10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: T.onSurface, cursor: 'pointer' }}>Ver</button>
                            <button onClick={() => navigate(`/admin/productos/editar/${p._id}`)} style={{ flex: 1, border: 'none', backgroundColor: T.primaryFixed, padding: '10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: T.primary, cursor: 'pointer' }}>Editar</button>
                            <button onClick={() => toggleStatus(p)} style={{ flex: 1, border: `1px solid ${T.outlineVariant}40`, backgroundColor: 'transparent', padding: '10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: T.onSurfaceVariant, cursor: 'pointer' }}>{p.isActive ? 'Pausar' : 'Activar'}</button>
                            <button onClick={() => setDeleteModal({ open: true, product: p, deleting: false })} style={{ border: `1px solid ${T.error}35`, backgroundColor: 'transparent', padding: '10px 14px', borderRadius: '9999px', fontSize: '14px', cursor: 'pointer' }} title="Eliminar">🗑️</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Vista: Categorías */}
        {activeTab === 'categorias' && (
          <div className="soft-shadow" style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '20px', padding: '32px', border: `1px solid ${T.outlineVariant}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.onSurface, margin: 0 }}>Gestión de Categorías</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: '13px', color: T.onSurfaceVariant, marginTop: '6px' }}>Al eliminar una categoría, sus productos se reasignan a <em>"Sin Categoría"</em>.</p>
              </div>
              <div style={{ backgroundColor: T.primaryFixed, borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🏷️</span>
                <span style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.primary }}>{categorias.length} categoría{categorias.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${T.outlineVariant}20`, marginTop: '20px', paddingTop: '8px' }}>
              {loading ? (
                <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', padding: '40px' }}>Cargando categorías...</p>
              ) : categorias.length === 0 ? (
                <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', padding: '40px' }}>No hay categorías registradas.</p>
              ) : (
                categorias.map(cat => {
                  const count = productosPorCategoria(cat);
                  return (
                    <div key={cat} className="cat-row">
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: T.primaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        🏷️
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 700, color: T.onSurface, margin: 0 }}>{cat}</p>
                        <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, margin: 0 }}>{count} producto{count !== 1 ? 's' : ''} asociado{count !== 1 ? 's' : ''}</p>
                      </div>
                      <span style={{ backgroundColor: count > 0 ? `${T.primary}15` : T.surfaceContainerHigh, color: count > 0 ? T.primary : T.onSurfaceVariant, fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px' }}>
                        {count}
                      </span>
                      <button className="delete-btn" onClick={() => setDeleteCatModal({ open: true, nombre: cat, deleting: false })} title={`Eliminar categoría "${cat}"`}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '28px', backgroundColor: T.primaryFixed, borderRadius: '14px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
              <div>
                <p style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, color: T.primary, margin: '0 0 4px' }}>¿Cómo crear nuevas categorías?</p>
                <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, margin: 0, lineHeight: 1.6 }}>
                  Las categorías se crean automáticamente al guardar un nuevo producto o editar uno existente. Simplemente escribe el nombre de la nueva categoría en el formulario del producto.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
