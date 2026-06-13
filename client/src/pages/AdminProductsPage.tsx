import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { productService } from '../services/api';
import type { Product } from '../types';

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = () => {
    setLoading(true);
    productService.getAll({ search: debouncedSearch, includeInactive: true }).then(res => {
      if (res.success && res.data) {
        setProducts(res.data);
        if (res.stats) setStats(res.stats);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [debouncedSearch]);

  const toggleStatus = async (p: Product) => {
    if (!window.confirm(`¿Seguro que deseas ${p.isActive ? 'desactivar' : 'reactivar'} el producto ${p.nombre}?`)) return;
    try {
      if (p.isActive) {
        await productService.deactivate(p._id);
      } else {
        await productService.reactivate(p._id);
      }
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  return (
    <AdminLayout 
      searchPlaceholder="Buscar producto por SKU, nombre, marca..." 
      searchValue={search} 
      onSearchChange={setSearch}
    >
      <style>{`
        .ghost-input {
          border: none !important;
          border-bottom: 1px solid ${T.outlineVariant}50 !important;
          background: transparent !important;
          border-radius: 0 !important;
          outline: none !important;
          box-shadow: none !important;
          transition: all 0.3s ease;
        }
        .ghost-input:focus {
          border-bottom: 2px solid ${T.primary} !important;
        }
        .soft-shadow {
          box-shadow: 0 20px 40px rgba(62, 2, 21, 0.02);
        }
        @media (max-width: 768px) {
          .admin-prod-container { padding: 24px 16px 120px !important; }
        }
      `}</style>
      
      <div className="admin-prod-container" style={{ padding: '40px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header Section */}
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
            style={{
              backgroundColor: T.primary, color: '#ffffff',
              padding: '14px 28px', borderRadius: '9999px',
              fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              border: 'none', cursor: 'pointer',
              boxShadow: `0 6px 20px rgba(148,69,85,0.30)`,
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>➕</span> Nuevo Producto
          </button>
        </div>

        {/* Dashboard Cards (Bento Grid) */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {/* Total */}
            <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30`, position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Total Productos</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: T.onSurface, margin: 0 }}>{stats.totalProductos}</p>
                <span style={{ fontSize: '24px' }}>📦</span>
              </div>
            </div>
            {/* Valor */}
            <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30`, position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Valor Inventario</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: T.primary, margin: 0 }}>{formatCurrency(stats.valorInventario)}</p>
                <span style={{ fontSize: '24px' }}>💰</span>
              </div>
            </div>
            {/* Low Stock */}
            <div style={{ backgroundColor: T.surfaceContainerLow, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30`, position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Stock Bajo</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: '#e2725b', margin: 0 }}>{stats.stockBajo}</p>
                <span style={{ fontSize: '24px' }}>⚠️</span>
              </div>
            </div>
            {/* Out of stock */}
            <div style={{ backgroundColor: T.surfaceContainerLow, padding: '24px', borderRadius: '16px', border: `1px solid ${T.outlineVariant}30`, position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.onSurfaceVariant, marginBottom: '16px' }}>Agotados</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: T.fontHeadline, fontSize: '32px', color: T.error, margin: 0 }}>{stats.agotados}</p>
                <span style={{ fontSize: '24px' }}>🚨</span>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Main area */}
        <div className="soft-shadow" style={{ backgroundColor: T.surfaceContainerLowest, borderRadius: '20px', padding: '32px', border: `1px solid ${T.outlineVariant}20` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '22px', color: T.onSurface, margin: 0 }}>Catálogo Principal</h3>
          </div>

          {loading ? (
            <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', padding: '40px' }}>Cargando catálogo...</p>
          ) : products.length === 0 ? (
            <p style={{ fontFamily: T.fontBody, color: T.onSurfaceVariant, textAlign: 'center', padding: '40px' }}>No hay productos registrados.</p>
          ) : (
            <>
              {/* Desktop View */}
              <div style={{ overflowX: 'auto', display: 'none' }} className="md-block">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.outlineVariant}30` }}>
                      <th style={{ paddingBottom: '16px', fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant }}>Producto</th>
                      <th style={{ paddingBottom: '16px', fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant }}>SKU</th>
                      <th style={{ paddingBottom: '16px', fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant }}>Categoría / Marca</th>
                      <th style={{ paddingBottom: '16px', fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, textAlign: 'right' }}>Precio</th>
                      <th style={{ paddingBottom: '16px', fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, textAlign: 'right' }}>Stock</th>
                      <th style={{ paddingBottom: '16px', fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, textAlign: 'center' }}>Estado</th>
                      <th style={{ paddingBottom: '16px', width: '120px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const isLow = p.rastrearStock && p.stock > 0 && p.stock <= p.stockMinimo;
                      const isOut = p.rastrearStock && p.stock === 0;
                      return (
                        <tr key={p._id} style={{ borderBottom: `1px solid ${T.outlineVariant}15` }}>
                          <td style={{ padding: '20px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <img src={p.imagenes?.[0] || 'https://via.placeholder.com/80'} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', backgroundColor: T.surfaceContainerLow }} />
                              <span style={{ fontFamily: T.fontBody, fontWeight: 700, fontSize: '16px', color: T.onSurface }}>{p.nombre}</span>
                            </div>
                          </td>
                          <td style={{ padding: '20px 0', fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant }}>{p.sku}</td>
                          <td style={{ padding: '20px 0' }}>
                            <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurface, margin: 0 }}>{p.categoria}</p>
                            <p style={{ fontFamily: T.fontBody, fontSize: '11px', color: T.onSurfaceVariant, margin: 0 }}>{p.marca}</p>
                          </td>
                          <td style={{ padding: '20px 0', fontFamily: T.fontBody, fontSize: '15px', fontWeight: 600, color: T.onSurface, textAlign: 'right' }}>
                            {formatCurrency(p.precioOferta && p.precioOferta > 0 ? p.precioOferta : p.precio)}
                            {p.costo !== undefined && <p style={{ fontSize: '11px', color: T.onSurfaceVariant, fontWeight: 400, margin: 0 }}>Costo: {formatCurrency(p.costo)}</p>}
                          </td>
                          <td style={{ padding: '20px 0', textAlign: 'right' }}>
                            <span style={{
                              fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600,
                              color: isOut ? T.error : isLow ? '#e2725b' : '#2e7d32'
                            }}>
                              {p.rastrearStock ? `${p.stock} un.` : 'Ilimitado'}
                            </span>
                          </td>
                          <td style={{ padding: '20px 0', textAlign: 'center' }}>
                            <button
                              onClick={() => toggleStatus(p)}
                              style={{
                                border: 'none', background: 'none', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center',
                                padding: '4px 12px', borderRadius: '9999px',
                                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                backgroundColor: p.isActive ? '#e2f0d9' : T.surfaceContainerHigh,
                                color: p.isActive ? '#2e7d32' : T.onSurfaceVariant
                              }}
                            >
                              {p.isActive ? 'Activo' : 'Pausado'}
                            </button>
                          </td>
                          <td style={{ padding: '20px 0', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => navigate(`/admin/productos/${p._id}`)} style={{ border: `1px solid ${T.outlineVariant}`, background: 'none', padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, color: T.onSurface, cursor: 'pointer' }}>Ver</button>
                              <button onClick={() => navigate(`/admin/productos/editar/${p._id}`)} style={{ border: 'none', backgroundColor: T.primaryFixed, padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, color: T.primary, cursor: 'pointer' }}>Editar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div style={{ display: 'none' }} className="mobile-block">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {products.map(p => {
                    const isOut = p.rastrearStock && p.stock === 0;
                    return (
                      <div key={p._id} style={{ padding: '16px', borderRadius: '16px', backgroundColor: T.surfaceContainerLow, border: `1px solid ${T.outlineVariant}30` }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <img src={p.imagenes?.[0] || 'https://via.placeholder.com/80'} alt="" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <h4 style={{ fontFamily: T.fontBody, fontSize: '16px', fontWeight: 700, color: T.onSurface, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.nombre}</h4>
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: p.isActive ? '#e2f0d9' : T.surfaceVariant, color: p.isActive ? '#2e7d32' : T.onSurfaceVariant }}>
                                {p.isActive ? 'Activo' : 'Pausado'}
                              </span>
                            </div>
                            <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, margin: '2px 0 6px' }}>{p.sku} • {p.marca}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontFamily: T.fontBody, fontSize: '15px', fontWeight: 600, color: T.primary }}>{formatCurrency(p.precioOferta || p.precio)}</span>
                              <span style={{ fontFamily: T.fontBody, fontSize: '12px', fontWeight: 600, color: isOut ? T.error : T.onSurface }}>Stock: {p.rastrearStock ? p.stock : '∞'}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <button onClick={() => navigate(`/admin/productos/${p._id}`)} style={{ flex: 1, border: `1px solid ${T.outlineVariant}40`, backgroundColor: '#fff', padding: '10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: T.onSurface, cursor: 'pointer' }}>Ver</button>
                          <button onClick={() => navigate(`/admin/productos/editar/${p._id}`)} style={{ flex: 1, border: 'none', backgroundColor: T.primaryFixed, padding: '10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: T.primary, cursor: 'pointer' }}>Editar</button>
                          <button onClick={() => toggleStatus(p)} style={{ flex: 1, border: `1px solid ${T.outlineVariant}40`, backgroundColor: 'transparent', padding: '10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: T.onSurfaceVariant, cursor: 'pointer' }}>
                            {p.isActive ? 'Pausar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <style>{`
                .md-block { display: block !important; }
                .mobile-block { display: none !important; }
                @media (max-width: 768px) {
                  .md-block { display: none !important; }
                  .mobile-block { display: block !important; }
                }
              `}</style>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
