import { useState, useEffect } from 'react';
import type { SinglePageVisibility, PaginasOcultas } from '../types';

const CACHE_KEY = 'sdb_page_visibility';
const CACHE_TTL_MS = 60_000; // 60 segundos

interface CacheEntry {
  data: PaginasOcultas;
  timestamp: number;
}

const DEFAULT_CHATBOT_VISIBILITY: SinglePageVisibility = {
  habilitada: true,
  mensajeTitulo: 'Agendamiento no disponible',
  mensajeCuerpo: 'El agendamiento en línea no está disponible en este momento.',
  botones: [
    { texto: 'Ver Productos', ruta: '/productos', tipo: 'interno' },
    { texto: 'Volver al Inicio', ruta: '/', tipo: 'interno' },
  ],
};

const DEFAULT_PAGES: PaginasOcultas = {
  chatbot: DEFAULT_CHATBOT_VISIBILITY,
};

/**
 * Hook que carga y cachea el estado de visibilidad de páginas públicas.
 * Lee el campo `paginasOcultas` del endpoint público GET /api/config.
 * Cachea en sessionStorage con TTL de 60s para evitar refetch en cada navegación.
 *
 * CAPA 2 de seguridad: el router de la app usa este hook para redirigir
 * antes de renderizar el componente de la página deshabilitada.
 */
export function usePageVisibility() {
  const [pages, setPages] = useState<PaginasOcultas>(DEFAULT_PAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // 1. Intentar leer del caché
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
            setPages(entry.data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // caché corrupto, continuar con fetch
      }

      // 2. Fetch desde el servidor
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${apiBase}/config`, { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const body = await res.json();
        const paginasOcultas: PaginasOcultas = body?.data?.paginasOcultas ?? DEFAULT_PAGES;

        // Asegurar que el chatbot tiene valores por defecto si el campo no existe en BD (migración)
        const normalized: PaginasOcultas = {
          chatbot: {
            habilitada: paginasOcultas.chatbot?.habilitada ?? true,
            mensajeTitulo: paginasOcultas.chatbot?.mensajeTitulo ?? DEFAULT_CHATBOT_VISIBILITY.mensajeTitulo,
            mensajeCuerpo: paginasOcultas.chatbot?.mensajeCuerpo ?? DEFAULT_CHATBOT_VISIBILITY.mensajeCuerpo,
            botones: paginasOcultas.chatbot?.botones ?? DEFAULT_CHATBOT_VISIBILITY.botones,
          },
        };

        // 3. Guardar en caché
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: normalized, timestamp: Date.now() }));
        setPages(normalized);
      } catch {
        // Si falla, usar defaults (fail-open: no bloqueamos si el servidor no responde)
        setPages(DEFAULT_PAGES);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /**
   * Devuelve true si la página está habilitada (por defecto true).
   */
  const isEnabled = (pageName: keyof PaginasOcultas): boolean => {
    return pages[pageName]?.habilitada ?? true;
  };

  /**
   * Devuelve la configuración completa de una página.
   */
  const getPageConfig = (pageName: keyof PaginasOcultas): SinglePageVisibility => {
    return pages[pageName] ?? DEFAULT_CHATBOT_VISIBILITY;
  };

  /**
   * Invalida el caché de visibilidad (útil después de guardar cambios en admin).
   */
  const invalidateCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // ignorar
    }
  };

  return { pages, loading, isEnabled, getPageConfig, invalidateCache };
}
