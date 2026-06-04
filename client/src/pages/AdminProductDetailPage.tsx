import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import type { Product } from '../types';

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      productService.getById(id).then(res => {
        if (res.success && res.data) setProduct(res.data);
        setLoading(false);
      }).catch(() => {
        alert('Error cargando detalles del producto');
        navigate('/admin/productos');
      });
    }
  }, [id, navigate]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Producto no encontrado.</div>;

  const isLow = product.rastrearStock && product.stock > 0 && product.stock <= product.stockMinimo;
  const isOut = product.rastrearStock && product.stock === 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/productos')} className="text-gray-500 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{product.nombre}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {product.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{product.sku} • {product.marca} • {product.categoria}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/productos/editar/${product._id}`)}
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span>✏️</span> Editar Producto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── COLUMNA IZQUIERDA (Info y KPIs) ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
            {/* Img */}
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <img src={product.imagenes?.[0] || 'https://via.placeholder.com/400'} alt={product.nombre} className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Data */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Métricas del Producto</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Precio Venta</p>
                  <p className="text-xl font-bold text-[#944555] mt-1">{formatCurrency(product.precioOferta || product.precio)}</p>
                  {product.precioOferta && product.precioOferta > 0 && (
                    <p className="text-xs text-gray-400 line-through mt-0.5">{formatCurrency(product.precio)}</p>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Costo</p>
                  <p className="text-xl font-bold text-gray-700 mt-1">{product.costo !== undefined ? formatCurrency(product.costo) : 'N/D'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Rentabilidad: {product.costo ? (((product.precioOferta || product.precio) - product.costo) / (product.precioOferta || product.precio) * 100).toFixed(1) + '%' : '-'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Inventario</p>
                    {product.rastrearStock && (
                      <span className={`text-xs font-bold ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-green-600'}`}>
                        {isOut ? 'Agotado' : isLow ? 'Bajo' : 'Óptimo'}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{product.rastrearStock ? product.stock : 'Ilimitado'} <span className="text-sm font-medium text-gray-500">unidades</span></p>
                  {product.rastrearStock && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                      <div className={`h-1.5 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (product.stock / product.stockMinimo) * 50)}%` }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detalles Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-2 bg-[#ffd9de]/30 text-[#944555] rounded-lg">✨</span>
                <h3 className="font-bold text-gray-900">Ingredientes</h3>
              </div>
              <ul className="space-y-2">
                {product.ingredientes && product.ingredientes.length > 0 ? product.ingredientes.map((ing, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-[#944555] mt-0.5">•</span> {ing}</li>
                )) : <li className="text-sm text-gray-400 italic">No especificados</li>}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-2 bg-[#ffd9de]/30 text-[#944555] rounded-lg">💎</span>
                <h3 className="font-bold text-gray-900">Beneficios</h3>
              </div>
              <ul className="space-y-2">
                {product.beneficios && product.beneficios.length > 0 ? product.beneficios.map((ben, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> {ben}</li>
                )) : <li className="text-sm text-gray-400 italic">No especificados</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA (Historial dummy) ── */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex justify-between items-center">
              <span>Últimos Movimientos</span>
              <span className="text-xs font-normal text-gray-400 px-2 py-1 bg-gray-50 rounded-md">Próximamente</span>
            </h3>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {/* Dummy Entry 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-[#944555] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <span className="text-[10px]">−</span>
                </div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-900">Venta (WhatsApp)</span>
                    <span className="text-[10px] text-gray-400">Hoy</span>
                  </div>
                  <p className="text-xs text-gray-500">-2 unidades</p>
                </div>
              </div>

              {/* Dummy Entry 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <span className="text-[10px]">+</span>
                </div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-900">Ingreso Inventario</span>
                    <span className="text-[10px] text-gray-400">Hace 3 días</span>
                  </div>
                  <p className="text-xs text-gray-500">+10 unidades</p>
                </div>
              </div>

              {/* Dummy Entry 3 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-[#944555] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <span className="text-[10px]">−</span>
                </div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-900">Uso en cabina</span>
                    <span className="text-[10px] text-gray-400">Hace 5 días</span>
                  </div>
                  <p className="text-xs text-gray-500">-1 unidad</p>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-xl transition-colors">
              Ver Historial Completo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
