import { useState, useEffect } from 'react';
import { getCart, saveCart } from '../pages/ProductsPage';
import type { CartItem } from '../pages/ProductsPage';
import { productService } from '../services/api';
import type { SiteConfig } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig | null;
}

export default function CartDrawer({ isOpen, onClose, config }: CartDrawerProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [validating, setValidating] = useState(false);

  // Cargar el carrito cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      setCartItems(getCart());
    }
  }, [isOpen]);

  // Actualizar carrito
  const updateQty = (id: string, newQty: number) => {
    let updated = [...cartItems];
    if (newQty <= 0) {
      updated = updated.filter(item => item.product._id !== id);
    } else {
      const idx = updated.findIndex(item => item.product._id === id);
      if (idx >= 0) {
        updated[idx].qty = newQty;
      }
    }
    setCartItems(updated);
    saveCart(updated);
    window.dispatchEvent(new Event('sdb_cart_updated'));
  };

  const remove = (id: string) => updateQty(id, 0);

  const formatPrice = (price: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

  const total = cartItems.reduce((acc, item) => {
    const price = item.product.precioOferta && item.product.precioOferta > 0 ? item.product.precioOferta : item.product.precio;
    return acc + (price * item.qty);
  }, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setValidating(true);

    try {
      // 1. Obtener la información fresca de todos los productos en el carrito para validar el stock real en este segundo
      const promises = cartItems.map(item => productService.getById(item.product._id));
      const results = await Promise.all(promises);

      let discrepancies = [];
      let validCart: CartItem[] = [];

      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const res = results[i];

        if (res.success && res.data) {
          const actualProduct = res.data;

          if (actualProduct.rastrearStock && actualProduct.stock < item.qty) {
            if (actualProduct.stock === 0) {
              discrepancies.push(`• ${actualProduct.nombre} (Agotado)`);
            } else {
              discrepancies.push(`• ${actualProduct.nombre} (Solo quedan ${actualProduct.stock} uds)`);
              validCart.push({ ...item, qty: actualProduct.stock }); // Ajustar a la cantidad real
            }
          } else {
            validCart.push(item);
          }
        } else {
          discrepancies.push(`• ${item.product.nombre} (No encontrado)`);
        }
      }

      // Si hubo discrepancias, mostramos el warning y ajustamos el carrito
      if (discrepancies.length > 0) {
        alert(`Atención, el stock de algunos productos ha cambiado:\n\n${discrepancies.join('\n')}\n\nHemos ajustado tu bolsa con las cantidades disponibles reales.`);
        setCartItems(validCart);
        saveCart(validCart);
        window.dispatchEvent(new Event('sdb_cart_updated'));
        setValidating(false);
        return; // Detenemos aquí para que el usuario confirme su nueva bolsa antes de mandar a WhatsApp
      }

      // Registrar los movimientos de venta como pendientes en el backend
      await productService.checkout(cartItems.map(i => ({ productId: i.product._id, qty: i.qty })));

      // Si todo está bien, construir y enviar a WhatsApp
      const salonName = config?.nombreSalon || "L'Élixir Salon";
      const waNumber = config?.whatsapp?.replace(/\D/g, '') || '573000000000';
      const itemsText = cartItems.map(i => {
        const price = i.product.precioOferta && i.product.precioOferta > 0 ? i.product.precioOferta : i.product.precio;
        return `• ${i.product.nombre} (x${i.qty}) — ${formatPrice(price * i.qty)}`;
      }).join('\n');

      const msg = `Hola ${salonName}! 🌸\n\nMe gustaría pedir los siguientes productos:\n\n${itemsText}\n\n*Total: ${formatPrice(total)}*\n\n¿Tienen disponibilidad? Gracias!`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');

      // Opcional: limpiar carrito después de pedir? (Lo dejamos para que no se pierda si hay error en WA)
    } catch (err) {
      alert('Hubo un problema al verificar el inventario. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[110] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 italic font-serif">Tu Bolsa 🛍️</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p className="text-4xl mb-4">🛒</p>
              <p>Tu bolsa está vacía.</p>
            </div>
          ) : (
            cartItems.map((item, i) => {
              const p = item.product;
              const price = p.precioOferta && p.precioOferta > 0 ? p.precioOferta : p.precio;
              return (
                <div key={`${p._id}-${i}`} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <img src={p.imagenes?.[0] || 'https://via.placeholder.com/80'} alt={p.nombre} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">{p.nombre}</p>
                    <p className="text-[#944555] font-semibold text-sm">{formatPrice(price)}</p>

                    {/* Controles cantidad */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center bg-white border border-gray-200 rounded-full px-2 py-0.5">
                        <button onClick={() => updateQty(p._id, item.qty - 1)} className="text-gray-500 hover:text-gray-900 w-6 h-6 flex items-center justify-center">−</button>
                        <span className="w-6 text-center text-xs font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(p._id, item.qty + 1)} className="text-gray-500 hover:text-gray-900 w-6 h-6 flex items-center justify-center">+</button>
                      </div>
                      <button onClick={() => remove(p._id)} className="text-xs text-red-400 hover:text-red-600 underline">Quitar</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-semibold text-sm uppercase tracking-wider">Subtotal</span>
              <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={validating}
              className="w-full bg-[#944555] hover:bg-[#7a3845] text-white py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {validating ? 'Verificando inventario...' : 'Confirmar por WhatsApp'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
