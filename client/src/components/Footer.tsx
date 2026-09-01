import { Link } from 'react-router-dom';
import type { SiteConfig } from '../types';

const T = {
  fontHeadline: "'Noto Serif', serif",
  fontBody: "'Plus Jakarta Sans', sans-serif",
  primaryContainer: '#e8899a',
  outlineVariant: '#d9c1c3',
  onSurfaceVariant: '#534245',
  surfaceContainer: '#f2edea',
  primary: '#944555',
};

const wrap: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  paddingLeft: '16px',
  paddingRight: '16px',
  width: '100%',
  boxSizing: 'border-box',
};

interface FooterProps {
  config?: SiteConfig | null;
  dark?: boolean;
}

export default function Footer({ config, dark = true }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const salonName = config?.nombreSalon || "L'Élixir Salon";

  const rawPhone = config?.whatsapp?.replace(/\D/g, '') || '3000000000';
  const displayPhone = config?.whatsapp || '+57 300 000 0000';
  const displayEmail = config?.email || 'contacto@lelixirsalon.com';
  const whatsappUrl = config?.whatsappLink || `https://wa.me/57${rawPhone}`;
  const instagramUrl = config?.instagram
    ? config.instagram.startsWith('http')
      ? config.instagram
      : `https://instagram.com/${config.instagram.replace('@', '')}`
    : 'https://instagram.com';
  const facebookUrl = config?.facebook
    ? config.facebook.startsWith('http')
      ? config.facebook
      : `https://facebook.com/${config.facebook}`
    : 'https://facebook.com';

  const bgColor = dark ? '#2f1314' : T.surfaceContainer;
  const textColor = dark ? '#FFFFFF' : T.primary;
  const subtextColor = dark ? 'rgba(255,255,255,0.6)' : T.onSurfaceVariant;
  const mutedColor = dark ? 'rgba(255,255,255,0.35)' : 'rgba(83,66,69,0.6)';
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : `${T.outlineVariant}30`;

  return (
    <footer
      style={{
        backgroundColor: bgColor,
        borderTop: `1px solid ${borderColor}`,
        paddingTop: '56px',
        paddingBottom: '36px',
      }}
    >
      <div style={wrap}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          {/* Logo / Nombre del Salón */}
          <span
            style={{
              fontFamily: T.fontHeadline,
              fontStyle: 'italic',
              fontSize: '22px',
              color: textColor,
              letterSpacing: '-0.01em',
            }}
          >
            {salonName}
          </span>

          {/* Contacto Clickeable: Teléfono + Correo */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '20px',
              fontSize: '13px',
              fontFamily: T.fontBody,
            }}
          >
            <a
              href={`tel:+57${rawPhone}`}
              style={{
                color: subtextColor,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              📞 {displayPhone}
            </a>

            <a
              href={`mailto:${displayEmail}`}
              style={{
                color: subtextColor,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              ✉️ {displayEmail}
            </a>
          </div>

          {/* Enlaces a Redes Sociales y Accesos Rápidos */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '28px',
            }}
          >
            {[
              { label: 'Instagram', url: instagramUrl, isExternal: true },
              { label: 'Facebook', url: facebookUrl, isExternal: true },
              { label: 'WhatsApp', url: whatsappUrl, isExternal: true },
              { label: 'Acceso Admin', url: '/admin/login', isExternal: false },
            ].map((link) =>
              link.isExternal ? (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: subtextColor,
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.5')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.url}
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: subtextColor,
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.5')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Divisor */}
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              height: '1px',
              backgroundColor: borderColor,
              margin: '8px 0',
            }}
          />

          {/* Copyright con Año Dinámico */}
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: mutedColor,
              margin: 0,
            }}
          >
            {config?.footerTexto || `© ${currentYear} ${salonName}. El Arte de Cuidarte.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
