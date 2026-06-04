import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import type { Product } from '../types';

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // debounce
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
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona el inventario, precios y visualización en tienda.</p>
        </div>
        <button
          onClick={() => navigate('/admin/productos/nuevo')}
          className="bg-[#944555] hover:bg-[#7a3845] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          + Nuevo Producto
        </button>
      </div>

      {/* ── KPIs Bento Grid ── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Productos</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProductos}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Inventario (Costo)</p>
            <p className="text-3xl font-bold text-[#944555] mt-2">{formatCurrency(stats.valorInventario)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Bajo / Crítico</p>
            <p className="text-3xl font-bold text-orange-500 mt-2">{stats.stockBajo}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agotados</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{stats.agotados}</p>
          </div>
        </div>
      )}

      {/* ── Buscador ── */}
      <div className="bg-white p-4 rounded-t-2xl border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por SKU, nombre, marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Cargando catálogo...</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-b-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold">SKU / Marca</th>
                  <th className="px-6 py-4 font-semibold">Precio</th>
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  <th className="px-6 py-4 font-semibold text-center">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => {
                  const isLow = p.rastrearStock && p.stock > 0 && p.stock <= p.stockMinimo;
                  const isOut = p.rastrearStock && p.stock === 0;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.imagenes?.[0] || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          <div>
                            <p className="font-medium text-gray-900">{p.nombre}</p>
                            <p className="text-xs text-gray-500">{p.categoria}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm text-gray-900">{p.sku}</p>
                        <p className="text-xs text-gray-500">{p.marca}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{formatCurrency(p.precioOferta && p.precioOferta > 0 ? p.precioOferta : p.precio)}</p>
                        {p.costo !== undefined && <p className="text-xs text-gray-400">Costo: {formatCurrency(p.costo)}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOut ? 'bg-red-100 text-red-800' : isLow ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                          {p.rastrearStock ? `${p.stock} un.` : 'Ilimitado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(p)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${p.isActive ? 'bg-[#944555]' : 'bg-gray-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${p.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => navigate(`/admin/productos/${p._id}`)} className="text-[#944555] hover:text-[#7a3845] font-medium text-sm">Ver</button>
                        <button onClick={() => navigate(`/admin/productos/editar/${p._id}`)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Editar</button>
                      </td>
                    </tr>
                  );
                })}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay productos que coincidan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
            {products.map(p => {
              const isOut = p.rastrearStock && p.stock === 0;
              return (
                <div key={p._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex gap-4">
                    <img src={p.imagenes?.[0] || 'https://via.placeholder.com/80'} alt="" className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 leading-tight">{p.nombre}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{p.sku} • {p.marca}</p>
                      <p className="font-medium text-[#944555] mt-1">{formatCurrency(p.precioOferta || p.precio)}</p>
                      <p className={`text-xs mt-1 ${isOut ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>Stock: {p.rastrearStock ? p.stock : '∞'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigate(`/admin/productos/${p._id}`)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-700">Ver</button>
                    <button onClick={() => navigate(`/admin/productos/editar/${p._id}`)} className="flex-1 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700">Editar</button>
                    <button onClick={() => toggleStatus(p)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-700">{p.isActive ? 'Pausar' : 'Activar'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
