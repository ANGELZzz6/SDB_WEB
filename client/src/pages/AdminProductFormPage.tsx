import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    precio: 0, precioOferta: 0, costo: 0,
    stock: 0, stockMinimo: 15, rastrearStock: true,
  });

  const [ingredientesStr, setIngredientesStr] = useState('');
  const [beneficiosStr, setBeneficiosStr] = useState('');

  useEffect(() => {
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
    if (type === 'number') finalValue = Number(value);
    if (type === 'checkbox') finalValue = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        ingredientes: ingredientesStr.split(',').map(s => s.trim()).filter(Boolean),
        beneficios: beneficiosStr.split(',').map(s => s.trim()).filter(Boolean),
        precioOferta: formData.precioOferta === 0 ? undefined : formData.precioOferta,
        costo: formData.costo === 0 ? undefined : formData.costo,
      };

      if (id) {
        await productService.update(id, dataToSave);
      } else {
        await productService.create(dataToSave);
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
      alert('Cloudinary widget not loaded yet');
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

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando datos...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{id ? 'Editar Producto' : 'Nuevo Producto'}</h1>
          <p className="text-sm text-gray-500 mt-1">Completa los datos del producto para el catálogo.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <input required name="nombre" value={formData.nombre || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU * {id && <span className="text-xs text-orange-500 ml-2 font-normal">(No editable)</span>}</label>
              <input required name="sku" value={formData.sku || ''} onChange={handleChange} disabled={!!id} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
              <input required name="categoria" value={formData.categoria || ''} onChange={handleChange} placeholder="Ej. Capilar, Skincare..." className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
              <input name="marca" value={formData.marca || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows={3} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all resize-none" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Imagen Principal</h2>
            <button type="button" onClick={openCloudinary} className="text-sm font-medium text-[#944555] hover:text-[#7a3845] bg-[#ffd9de] px-4 py-2 rounded-lg transition-colors">Subir Imagen</button>
          </div>
          <div className="flex gap-4 items-center">
            {formData.imagenes && formData.imagenes.length > 0 ? (
              <img src={formData.imagenes[0]} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-50 border border-gray-200 border-dashed rounded-xl text-gray-400 text-sm">Sin imagen</div>
            )}
            <p className="text-xs text-gray-500 max-w-xs">Se recomienda usar imágenes cuadradas (1:1) o formato retrato (4:5) para el catálogo.</p>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Precios e Inventario</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio de Venta *</label>
              <input required type="number" name="precio" value={formData.precio} onChange={handleChange} min="0" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio Oferta <span className="font-normal text-gray-400">(0 para omitir)</span></label>
              <input type="number" name="precioOferta" value={formData.precioOferta} onChange={handleChange} min="0" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Costo Base <span className="font-normal text-gray-400">(Privado)</span></label>
              <input type="number" name="costo" value={formData.costo} onChange={handleChange} min="0" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
            </div>
            
            <div className="col-span-3 h-px bg-gray-100 my-2"></div>

            <div className="col-span-3 flex items-center gap-3">
              <input type="checkbox" id="rastrearStock" name="rastrearStock" checked={formData.rastrearStock} onChange={handleChange} className="w-5 h-5 text-[#944555] rounded focus:ring-[#944555]" />
              <label htmlFor="rastrearStock" className="text-sm font-medium text-gray-700">Rastrear inventario de este producto</label>
            </div>
            {formData.rastrearStock && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Actual *</label>
                  <input required type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alerta Stock Bajo</label>
                  <input type="number" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} min="0" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Detalles (Bento Grid)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ingredientes Clave <span className="font-normal text-gray-400">(Separados por coma)</span></label>
              <textarea value={ingredientesStr} onChange={e => setIngredientesStr(e.target.value)} rows={3} placeholder="Ácido Hialurónico, Vitamina C..." className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beneficios <span className="font-normal text-gray-400">(Separados por coma)</span></label>
              <textarea value={beneficiosStr} onChange={e => setBeneficiosStr(e.target.value)} rows={3} placeholder="Hidratación profunda, Brillo instantáneo..." className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pb-20">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
          <button type="submit" disabled={saving} className="px-8 py-3 font-medium text-white bg-[#944555] hover:bg-[#7a3845] disabled:opacity-70 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors">
            {saving ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
