import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { T } from '../lib/adminTokens';
import { productService } from '../services/api';
import type { Product, ProductMovement } from '../types';

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Formulario para movimiento manual
  const [showAddMov, setShowAddMov] = useState(false);
  const [movTipo, setMovTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movQty, setMovQty] = useState(1);
  const [movMotivo, setMovMotivo] = useState('');

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      productService.getById(id),
      productService.getMovements(id)
    ]).then(([resProd, resMovs]) => {
      if (resProd.success && resProd.data) {
        setProduct(resProd.data);
      }
      if (resMovs.success && resMovs.data) {
        setMovements(resMovs.data);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      alert('Error cargando detalles del producto');
      navigate('/admin/productos');
    });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleConfirmMovement = async (movId: string) => {
    if (!window.confirm('¿Seguro que deseas confirmar este movimiento y ajustar el inventario?')) return;
    setActionLoading(true);
    try {
      const res = await productService.confirmMovement(movId);
      if (res.success) {
        alert(res.message || 'Movimiento confirmado e inventario actualizado.');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al confirmar movimiento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMovement = async (movId: string) => {
    if (!window.confirm('¿Seguro que deseas cancelar/eliminar este movimiento pendiente?')) return;
    setActionLoading(true);
    try {
      const res = await productService.deleteMovement(movId);
      if (res.success) {
        alert(res.message || 'Movimiento pendiente cancelado.');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar movimiento');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || movQty <= 0) return;
    setActionLoading(true);
    try {
      const res = await productService.createMovement(id, {
        tipo: movTipo,
        cantidad: movQty,
        motivo: movMotivo.trim() || undefined,
        confirmado: true // Al crearlo el admin, se descuenta/ingresa de inmediato
      });
      if (res.success) {
        alert('Movimiento de inventario registrado con éxito.');
        setMovQty(1);
        setMovMotivo('');
        setShowAddMov(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Error al registrar movimiento');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '64px', textAlign: 'center', color: T.onSurfaceVariant, fontFamily: T.fontBody }}>
          Cargando detalles del producto...
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div style={{ padding: '64px', textAlign: 'center', color: T.error, fontFamily: T.fontBody }}>
          Producto no encontrado.
        </div>
      </AdminLayout>
    );
  }

  const isLow = product.rastrearStock && product.stock > 0 && product.stock <= product.stockMinimo;
  const isOut = product.rastrearStock && product.stock === 0;

  return (
    <AdminLayout searchPlaceholder="Buscar en este producto...">
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .ambient-shadow {
          box-shadow: 0 20px 40px rgba(62, 2, 21, 0.04);
        }
        .ghost-border {
          border-bottom: 1px solid rgba(217, 193, 195, 0.2);
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        .detail-header-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        @media (min-width: 640px) {
          .detail-header-grid {
            grid-template-columns: 240px 1fr;
          }
        }
        @media (min-width: 1024px) {
          .detail-grid {
            grid-template-columns: 7fr 5fr;
          }
        }
        @media (max-width: 768px) {
          .admin-detail-container { padding: 24px 16px 120px !important; }
          .detail-header { flex-direction: column; align-items: flex-start !important; gap: 16px; margin-bottom: 24px !important; }
        }
      `}</style>

      <div className="admin-detail-container" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <button
              onClick={() => navigate('/admin/productos')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.15em',
                color: T.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: '4px',
                marginBottom: '8px', padding: 0
              }}
            >
              <span>⬅</span> Volver a Productos
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: 'clamp(24px, 5vw, 36px)', color: T.primary, fontWeight: 700, margin: 0 }}>
                {product.nombre}
              </h1>
              <span style={{
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '4px 12px', borderRadius: '9999px',
                backgroundColor: product.isActive ? '#e2f0d9' : T.surfaceContainerHigh,
                color: product.isActive ? '#2e7d32' : T.onSurfaceVariant
              }}>
                {product.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, marginTop: '4px', margin: 0 }}>
              SKU: {product.sku}
            </p>
          </div>
          <button
            onClick={() => navigate(`/admin/productos/editar/${product._id}`)}
            style={{
              backgroundColor: '#fff', color: T.onSurface,
              border: `1px solid ${T.outlineVariant}60`,
              padding: '12px 24px', borderRadius: '9999px',
              fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', transition: 'background-color 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = T.surfaceContainerLow)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            <span>✏️</span> Editar
          </button>
        </div>

        {/* Main Grid */}
        <div className="detail-grid">
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Gallery & Description */}
            <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '32px', borderRadius: '24px', border: `1px solid ${T.outlineVariant}20` }} className="ambient-shadow">
              <div className="detail-header-grid">
                <div style={{ width: '100%', maxWidth: '240px', aspectRatio: '4/5', borderRadius: '16px', overflow: 'hidden', backgroundColor: T.surfaceContainerLow, border: `1px solid ${T.outlineVariant}30` }}>
                  <img src={product.imagenes?.[0] || 'https://via.placeholder.com/400'} alt={product.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, marginTop: 0, marginBottom: '16px' }}>Métricas & Precios</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ backgroundColor: T.surfaceContainerLow, padding: '16px', borderRadius: '12px' }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant }}>Precio Venta</span>
                      <p style={{ fontFamily: T.fontHeadline, fontSize: '20px', color: T.primary, margin: '4px 0 0' }}>{formatCurrency(product.precioOferta && product.precioOferta > 0 ? product.precioOferta : product.precio)}</p>
                      {product.precioOferta && product.precioOferta > 0 && <p style={{ fontSize: '11px', color: T.onSurfaceVariant, margin: 0, textDecoration: 'line-through' }}>{formatCurrency(product.precio)}</p>}
                    </div>
                    <div style={{ backgroundColor: T.surfaceContainerLow, padding: '16px', borderRadius: '12px' }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant }}>Costo Artículo</span>
                      <p style={{ fontFamily: T.fontHeadline, fontSize: '20px', color: T.onSurface, margin: '4px 0 0' }}>{product.costo ? formatCurrency(product.costo) : 'N/D'}</p>
                      {product.costo ? <p style={{ fontSize: '11px', color: '#2e7d32', margin: 0 }}>Margen: {(((product.precioOferta || product.precio) - product.costo) / (product.precioOferta || product.precio) * 100).toFixed(1)}%</p> : null}
                    </div>
                    <div style={{ backgroundColor: T.surfaceContainerLow, padding: '16px', borderRadius: '12px', gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant }}>Cantidad Inventario</span>
                        <span style={{ fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700, color: isOut ? T.error : isLow ? '#e2725b' : '#2e7d32' }}>
                          {isOut ? 'AGOTADO' : isLow ? 'STOCK BAJO' : 'STOCK ÓPTIMO'}
                        </span>
                      </div>
                      <p style={{ fontFamily: T.fontHeadline, fontSize: '24px', color: T.onSurface, margin: '4px 0 0' }}>{product.rastrearStock ? `${product.stock} unidades` : 'Ilimitado'}</p>
                      {product.rastrearStock && (
                        <div style={{ width: '100%', height: '6px', borderRadius: '9999px', backgroundColor: T.surfaceVariant, marginTop: '12px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '9999px', backgroundColor: isOut ? T.error : isLow ? '#e2725b' : '#2e7d32', width: `${Math.min(100, (product.stock / product.stockMinimo) * 50)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, display: 'block', marginBottom: '8px' }}>Descripción</span>
                <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, lineHeight: 1.8, margin: 0 }}>
                  {product.descripcion || 'Sin descripción provista.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', borderTop: `1px solid ${T.outlineVariant}30`, paddingTop: '24px' }}>
                <div>
                  <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, display: 'block', marginBottom: '8px' }}>Categoría</span>
                  <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, margin: 0 }}>{product.categoria}</p>
                </div>
                <div>
                  <span style={{ fontFamily: T.fontBody, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.onSurfaceVariant, display: 'block', marginBottom: '8px' }}>Marca</span>
                  <p style={{ fontFamily: T.fontBody, fontSize: '15px', color: T.onSurface, margin: 0 }}>{product.marca}</p>
                </div>
              </div>
            </div>

            {/* Bento Grid: Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '24px', borderRadius: '20px', border: `1px solid ${T.outlineVariant}20` }} className="ambient-shadow">
                <h4 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.primary, marginTop: 0, marginBottom: '16px' }}>🌸 Ingredientes Clave</h4>
                <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {product.ingredientes && product.ingredientes.length > 0 ? product.ingredientes.map((ing, i) => (
                    <li key={i} style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant }}>{ing}</li>
                  )) : <li style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, fontStyle: 'italic' }}>No especificados</li>}
                </ul>
              </div>
              <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '24px', borderRadius: '20px', border: `1px solid ${T.outlineVariant}20` }} className="ambient-shadow">
                <h4 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '18px', color: T.primary, marginTop: 0, marginBottom: '16px' }}>✓ Beneficios Clave</h4>
                <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {product.beneficios && product.beneficios.length > 0 ? product.beneficios.map((ben, i) => (
                    <li key={i} style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant }}>{ben}</li>
                  )) : <li style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, fontStyle: 'italic' }}>No especificados</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column (Inventory & Movements) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Inventory Movements */}
            <div style={{ backgroundColor: T.surfaceContainerLowest, padding: '32px', borderRadius: '24px', border: `1px solid ${T.outlineVariant}20`, display: 'flex', flexDirection: 'column' }} className="ambient-shadow">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: T.fontHeadline, fontStyle: 'italic', fontSize: '20px', color: T.onSurface, margin: 0 }}>Últimos Movimientos</h3>
                <button
                  onClick={() => setShowAddMov(!showAddMov)}
                  style={{
                    backgroundColor: T.primaryFixed, color: T.primary,
                    border: 'none', padding: '6px 12px', borderRadius: '9999px',
                    fontFamily: T.fontBody, fontSize: '11px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer'
                  }}
                >
                  {showAddMov ? 'Cancelar' : '+ Registrar'}
                </button>
              </div>

              {/* Formulario de movimiento manual */}
              {showAddMov && (
                <form onSubmit={handleAddMovementSubmit} style={{ padding: '16px', backgroundColor: T.surfaceContainerLow, borderRadius: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 700, margin: 0, color: T.onSurface }}>Registrar Ajuste Manual (Afecta stock al guardar)</h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: '11px', color: T.onSurfaceVariant, gap: '4px' }}>
                      Tipo
                      <select value={movTipo} onChange={e => setMovTipo(e.target.value as any)} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}50`, outline: 'none' }}>
                        <option value="ingreso">Ingreso (+)</option>
                        <option value="egreso">Egreso (-)</option>
                      </select>
                    </label>
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: '11px', color: T.onSurfaceVariant, gap: '4px' }}>
                      Cantidad
                      <input type="number" min="1" value={movQty} onChange={e => setMovQty(Math.max(1, Number(e.target.value)))} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}50`, outline: 'none' }} />
                    </label>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: T.onSurfaceVariant, gap: '4px' }}>
                    Motivo / Descripción
                    <input type="text" placeholder="Ej: Ajuste manual, pérdida, etc." value={movMotivo} onChange={e => setMovMotivo(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}50`, outline: 'none' }} />
                  </label>
                  <button type="submit" disabled={actionLoading} style={{ backgroundColor: T.primary, color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontFamily: T.fontBody, fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
                    Guardar Ajuste
                  </button>
                </form>
              )}

              {/* Movements Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {movements.length === 0 ? (
                  <p style={{ fontFamily: T.fontBody, fontSize: '14px', color: T.onSurfaceVariant, margin: '20px 0', textAlign: 'center' }}>No hay movimientos registrados.</p>
                ) : (
                  movements.map((mov) => {
                    const isIngreso = mov.tipo === 'ingreso';
                    return (
                      <div key={mov._id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: `1px solid ${T.outlineVariant}20` }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isIngreso ? '#e2f0d9' : T.errorContainer,
                          color: isIngreso ? '#2e7d32' : T.error,
                          fontWeight: 700, fontSize: '16px', flexShrink: 0
                        }}>
                          {isIngreso ? '+' : '−'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontFamily: T.fontBody, fontSize: '14px', fontWeight: 700, color: T.onSurface, margin: 0 }}>
                              {mov.motivo}
                            </p>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                              backgroundColor: mov.confirmado ? '#e5e7eb' : T.primaryFixed,
                              color: mov.confirmado ? '#4b5563' : T.primary
                            }}>
                              {mov.confirmado ? 'Confirmado' : 'Pendiente'}
                            </span>
                          </div>
                          <p style={{ fontFamily: T.fontBody, fontSize: '12px', color: T.onSurfaceVariant, margin: '2px 0 6px' }}>
                            {isIngreso ? 'Ingreso' : 'Egreso'} de {mov.cantidad} uds • {formatDate(mov.createdAt)}
                          </p>

                          {/* Acciones para movimientos pendientes (ventas de WhatsApp) */}
                          {!mov.confirmado && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button
                                disabled={actionLoading}
                                onClick={() => handleConfirmMovement(mov._id)}
                                style={{
                                  backgroundColor: '#2e7d32', color: '#fff',
                                  border: 'none', padding: '6px 12px', borderRadius: '6px',
                                  fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(46,125,50,0.15)'
                                }}
                              >
                                Confirmar Resta
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={() => handleDeleteMovement(mov._id)}
                                style={{
                                  backgroundColor: 'transparent', color: T.error,
                                  border: `1px solid ${T.error}40`, padding: '6px 12px', borderRadius: '6px',
                                  fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                                }}
                              >
                                Descartar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
