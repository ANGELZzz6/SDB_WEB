import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = "L'Élixir Salon — Salón de Belleza Bogotá";
const DEFAULT_DESCRIPTION = "Un espacio exclusivo diseñado para resaltar tu luz propia con servicios de lujo y atención personalizada en Bogotá.";

export default function SEOHead({ title, description }: SEOHeadProps) {
  useEffect(() => {
    // 1. Título de página
    const fullTitle = title ? `${title} | L'Élixir Salon` : DEFAULT_TITLE;
    document.title = fullTitle;

    // 2. Meta descripción
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    // 3. Open Graph Title & Description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }
  }, [title, description]);

  return null;
}
