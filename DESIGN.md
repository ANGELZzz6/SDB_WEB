# DESIGN.md — Sistema de Diseño "SDB"
## Creative North Star: **"The Ethereal Editor"**

> Este documento es la fuente de verdad del sistema de diseño del Salón de Belleza.
> Extraído del proyecto **SDB** en Stitch + código fuente del repositorio.
> **NO implementar código hasta aprobar este documento.**

---

## 1. Paleta de Colores Completa

### Filosofía de Color
La paleta está inspirada en tonos de piel y matices botánicos, diseñada para sentirse *"iluminada desde adentro"*. Evita el blanco clínico puro usando un fondo crema cálido como base.

### Colores Primarios

| Token                     | Hex       | Uso                                              |
|---------------------------|-----------|--------------------------------------------------|
| `primary`                 | `#944555` | Botones principales, acentos, logo               |
| `primary-container`       | `#E8899A` | Hover de botón primario, acentos secundarios     |
| `primary-fixed`           | `#FFD9DE` | Fondos de íconos, highlights sutiles             |
| `primary-fixed-dim`       | `#FFB2BE` | Inverse primary (dark surfaces)                  |
| `on-primary`              | `#FFFFFF` | Texto sobre fondo primario                       |
| `on-primary-container`    | `#682233` | Texto sobre primary-container                    |
| `on-primary-fixed`        | `#3E0215` | Texto sobre primary-fixed                        |
| `on-primary-fixed-variant`| `#772E3E` | Variante texto sobre primary-fixed               |

### Colores Secundarios

| Token                      | Hex       | Uso                                        |
|----------------------------|-----------|--------------------------------------------|
| `secondary`                | `#7D5630` | Íconos de madera/tierra, elementos táctiles |
| `secondary-container`      | `#FFCA9B` | Botones secundarios (background)           |
| `secondary-fixed`          | `#FFDCBF` | Estado fijo secundario                     |
| `secondary-fixed-dim`      | `#F0BD8F` | Variante fija secundaria                   |
| `on-secondary`             | `#FFFFFF` | Texto sobre secondary                      |
| `on-secondary-container`   | `#7A532E` | Texto sobre secondary-container            |

### Colores Terciarios

| Token                     | Hex       | Uso                                  |
|---------------------------|-----------|--------------------------------------|
| `tertiary`                | `#7B5455` | Acentos de contraste cálido          |
| `tertiary-container`      | `#C79999` | Contenedor terciario                 |
| `tertiary-fixed`          | `#FFDAD9` | Estado fijo terciario                |
| `tertiary-fixed-dim`      | `#ECBBBA` | Variante fija terciaria              |
| `on-tertiary`             | `#FFFFFF` | Texto sobre tertiary                 |
| `on-tertiary-container`   | `#523132` | Texto sobre tertiary-container       |

### Superficies (Surface Hierarchy)

Las superficies se tratan como capas físicas de papel fino. **Regla fundamental**: no usar bordes de 1px para separar secciones; usar cambios de color de fondo.

| Token                        | Hex       | Nivel          | Uso                                           |
|------------------------------|-----------|----------------|-----------------------------------------------|
| `surface`                    | `#FDF8F5` | Base (Level 0) | Fondo principal de la app                     |
| `surface-container-lowest`   | `#FFFFFF` | Flotante       | Cards más elevadas, elemens flotantes         |
| `surface-container-low`      | `#F8F3F0` | Level 1        | Secciones alternadas, fondos de imagen        |
| `surface-container`          | `#F2EDEA` | Level 2        | Módulos internos de página                    |
| `surface-container-high`     | `#ECE7E4` | Level 3        | Secciones con mayor énfasis                   |
| `surface-container-highest`  | `#E6E2DF` | Level 4        | El nivel de superficie más alto               |
| `surface-bright`             | `#FDF8F5` | Alias surface  | Superficie brillante                          |
| `surface-dim`                | `#DED9D6` | Oscurecido     | Superficie atenuada                           |
| `surface-variant`            | `#E6E2DF` | Variante       | Fondo de chips no seleccionados               |
| `surface-tint`               | `#944555` | Tint           | Tinte de superficie (glassmorphism)           |

### Texto sobre Superficies

| Token                | Hex       | Uso                                               |
|----------------------|-----------|---------------------------------------------------|
| `on-surface`         | `#1C1B1A` | Texto principal (nunca negro puro `#000`)         |
| `on-surface-variant` | `#534245` | Texto secundario/descriptivo (tono cálido)        |
| `background`         | `#FDF8F5` | Alias del fondo de la app                         |
| `on-background`      | `#1C1B1A` | Texto sobre fondo                                 |

### Outlines

| Token              | Hex       | Uso                                           |
|--------------------|-----------|-----------------------------------------------|
| `outline`          | `#867274` | Outline accesible (solo si es estrictamente necesario) |
| `outline-variant`  | `#D9C1C3` | "Ghost Border" al 20% de opacidad máximo      |

### Error

| Token               | Hex       |
|---------------------|-----------|
| `error`             | `#BA1A1A` |
| `error-container`   | `#FFDAD6` |
| `on-error`          | `#FFFFFF` |
| `on-error-container`| `#93000A` |

### Inverse (para dark surfaces)

| Token               | Hex       |
|---------------------|-----------|
| `inverse-surface`   | `#32302E` |
| `inverse-on-surface`| `#F5F0ED` |
| `inverse-primary`   | `#FFB2BE` |

---

## 2. Tipografía

### Familias

| Rol               | Familia          | Fuente Google Fonts                              |
|-------------------|------------------|--------------------------------------------------|
| Display/Headlines | `Noto Serif`     | `ital,wght@0,100..900;1,100..900`               |
| Body/Titles       | `Plus Jakarta Sans` | `ital,wght@0,200..800;1,200..800`            |
| Labels/Actions    | `Plus Jakarta Sans` | Mismo que body, en uppercase + tracking        |

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
```

### Escala Tipográfica

| Token           | Tamaño          | Peso       | Familia          | Uso                                    |
|-----------------|-----------------|------------|------------------|----------------------------------------|
| `display-lg`    | `3.5rem` (56px) | 400–600    | Noto Serif       | Hero statement principal               |
| `display-md`    | `3rem` (48px)   | 400–600    | Noto Serif       | Titulares de sección grandes           |
| `headline-lg`   | `5rem` (80px)   | 400        | Noto Serif       | Hero (desktop, `lg:text-[5rem]`)       |
| `headline-md`   | `1.75rem` (28px)| 400        | Noto Serif       | Categorías de servicio                 |
| `body-lg`       | `1.125rem` (18px)| 400       | Plus Jakarta Sans| Descripciones de servicio              |
| `body-md`       | `1rem` (16px)   | 400        | Plus Jakarta Sans| Cuerpo general                         |
| `body-sm`       | `0.875rem` (14px)| 400       | Plus Jakarta Sans| Texto auxiliar                         |
| `label-md`      | `0.875rem` (14px)| 500–600   | Plus Jakarta Sans| Botones, metadatos (uppercase)         |
| `label-sm`      | `0.75rem` (12px)| 500–600    | Plus Jakarta Sans| Chips, etiquetas pequeñas              |

### Reglas de Uso

- **Headlines (Noto Serif)**: Para "El Gancho" — alto contraste, elegante, evocador. Usarlo en modo *italic* para énfasis emocional (ej: `"nuestro arte."`, `"de trabajos"`).
- **Body/Labels (Plus Jakarta Sans)**: Para "El Hecho" — geométrico, limpio, muy legible.
- **Labels en botones**: Siempre `uppercase` + `tracking-widest` (0.1em+) para un acabado moderno y limpio.
- **Tensión tipográfica**: Una diferencia de escala extrema entre título (`display-lg`) y cuerpo (`body-md`) separados por `spacing-6` señala autoridad y posicionamiento premium.

### Jerarquías aplicadas en Landing Page

```
Hero h1:     text-6xl → text-7xl → text-[5rem]  (Noto Serif 400/italic para span)
Sección h2:  text-5xl → text-6xl               (Noto Serif 400)
Card h3:     text-3xl → text-4xl               (Noto Serif 400)
Card h4:     text-2xl → text-3xl               (Noto Serif 400)
Body p:      text-lg → text-xl                 (Plus Jakarta Sans 400)
Subtítulo:   text-sm uppercase tracking-widest  (Plus Jakarta Sans 500, color: primary)
```

---

## 3. Espaciados y Grid System

### Escala de Espaciado
`spacingScale: 3` en Stitch (Tailwind base × 1.5). Los tokens equivalentes en Tailwind:

| Token (concepto) | Tailwind class | px    | Uso típico                              |
|------------------|----------------|-------|-----------------------------------------|
| `spacing-1`      | `p-1`          | 4px   | Micro-gaps internos                     |
| `spacing-2`      | `p-2`          | 8px   | Separación mínima entre items de lista  |
| `spacing-4`      | `p-4`          | 16px  | Padding interno de chips, tags          |
| `spacing-6`      | `p-6`          | 24px  | Gap entre párrafo y título              |
| `spacing-8`      | `p-8`          | 32px  | Separación de secciones internas        |
| `spacing-10`     | `p-10`         | 40px  | Padding de cards bento (`md:p-12`)      |
| `spacing-12`     | `p-12`         | 48px  | Padding de cards en desktop             |
| `spacing-14`     | `p-14`         | 56px  | Margen entre h3 y lista de items        |
| `spacing-16`     | `py-16`        | 64px  | Padding vertical de sección (mobile)    |
| `spacing-20`     | `mb-20`        | 80px  | Margen inferior de headers de sección   |
| `spacing-24`     | `py-24`        | 96px  | Padding vertical de secciones           |
| `spacing-32`     | `py-32`        | 128px | Padding vertical desktop de secciones   |

> **Regla de espacio premium**: Si una sección se siente *"apretada"*, duplicar el espaciado con `spacing-16` o `spacing-20`. En diseño de lujo, el espacio es una *feature*, no un vacío.

### Grid System

```
Max-width contenedor:  max-w-7xl (1280px)
Padding horizontal:    px-6 (24px) en todos los breakpoints
Centrado:              mx-auto
```

#### Grids por sección

| Sección            | Mobile         | Tablet (md)       | Desktop (lg)         |
|--------------------|----------------|-------------------|----------------------|
| Hero               | `grid-cols-1`  | —                 | `grid-cols-2` gap-16 |
| Bento Servicios    | `grid-cols-1`  | —                 | `grid-cols-3` gap-6  |
| Especialistas      | `grid-cols-1`  | `grid-cols-2` gap-16 | gap-20            |
| Galería            | `grid-cols-1`  | `grid-cols-2`     | `grid-cols-4` gap-6  |
| Contacto           | `grid-cols-1`  | —                 | `grid-cols-2` gap-20 |

### Border Radius (Roundness: `ROUND_EIGHT` = `0.5rem` base)

| Clase Tailwind  | px     | Uso                                              |
|-----------------|--------|--------------------------------------------------|
| `rounded-full`  | 50%    | Botones primarios, íconos circulares, FAB         |
| `rounded-[3rem]`| 48px   | Hero image (desktop)                             |
| `rounded-[2.5rem]`| 40px | Cards bento, imágenes de especialistas           |
| `rounded-[2rem]`| 32px   | Imágenes de galería                              |
| `rounded-[1.5rem]`| 24px | Cards de servicio medianas (xl radius)           |
| `rounded-xl`    | 12px   | Contenedores de íconos en bento                  |

---

## 4. Reglas de Componentes

### 4.1 Botones

#### Botón Primario (CTA Principal)
```
Background:  primary (#944555)
Text:        on-primary (#FFFFFF)
Shape:       rounded-full
Padding:     px-8 py-4
Font:        Plus Jakarta Sans, uppercase, tracking-widest, text-sm
Icon:        gap-3 con ícono de 16×16
Hover:       bg-primary-container (#E8899A) + text-on-surface
Transition:  duration-300
Shadow:      shadow-sm + backdrop-blur-sm
```

#### Botón Secundario (Outlined / Ghost)
```
Background:  transparent
Border:      border-2 border-primary (#944555)
Text:        primary (#944555)
Shape:       rounded-full
Padding:     px-8 py-4
Hover:       bg-primary + text-on-primary (#FFFFFF)
Transition:  duration-300
```

#### Botón Terciario (Link-style)
```
Background:  none
Text:        primary (#944555) → primary-container on hover
Decoration:  border-b-2 border-primary
Padding:     pb-1
Font:        uppercase tracking-widest text-sm (label-md)
```

#### Botón Nav (Glass)
```
Background:  bg-white/70 backdrop-blur-md
Text:        primary (#944555)
Shape:       rounded-full
Padding:     px-8 py-3
Hover:       bg-primary + text-white
Visible:     hidden md:inline-flex
```

#### FAB — "The Floating Concierge"
```
Position:    fixed bottom-8 right-8 (md: bottom-12 right-12)
Background:  primary/95 (#944555 al 95% opacidad)
Text:        white
Shape:       rounded-full
Padding:     px-8 py-5
Z-index:     z-50
Hover:       bg-primary-container + scale-105
Shadow:      shadow-xl
Backdrop:    backdrop-blur-md
Animation:   transition-all duration-300
```

#### Botón WhatsApp
```
Background:  surface-container (#F2EDEA)
Text:        on-surface
Shape:       rounded-full
Padding:     px-10 py-5
Hover:       bg-surface-container-high
Icon:        MessageCircle color #25D366
```

### 4.2 Navbar

```
Position:     fixed top-0 left-0 w-full z-50
Height:       h-24 (96px)
Background:   Glassmorphism → surface-container-lowest @ 70% + blur(12px)
Border:       border-b border-transparent
Max-width:    max-w-7xl mx-auto px-6
Logo:         Noto Serif text-3xl text-primary cursor-pointer
              hover: opacity-80 transition-opacity tracking-tight
CTA:          Botón Nav (glass) — visible solo en md+
```

**Clase CSS personalizada `.glass-nav`:**
```css
.glass-nav {
  background-color: color-mix(in srgb, #FFFFFF 70%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### 4.3 Cards — Bento Grid (Servicios)

```
Background:   surface (#FDF8F5) o surface-container-high (#ECE7E4)
Shape:        rounded-[2.5rem] (40px)
Padding:      p-10 md:p-12
Shadow:       shadow-sm
Hover:        bg-surface-container-lowest + transition-all
Layout:       flex flex-col justify-between
```

**Ícono en card:**
```
Container:   w-16 h-16 rounded-full flex items-center justify-center mb-10
Background:  primary-fixed (#FFD9DE) — card principal
             surface-container-high — cards secundarias
Icon size:   w-8 h-8
```

**Bento layout lg:**
- Item 1: `lg:col-span-2` — Card principal grande
- Item 2: `lg:col-span-1` — Card secundaria
- Item 3: `lg:col-span-1` — Card secundaria
- Item 4: `lg:col-span-2` — Card destacada con CTA

### 4.4 Cards — Especialistas

```
Container:    flex flex-col items-center max-w-md mx-auto
Imagen:       w-full aspect-[3/4] rounded-[2.5rem] overflow-hidden
              hover: scale-[1.02] transition-transform shadow-sm
Nombre:       text-4xl font-heading (Noto Serif) mb-3
Especialidad: font-label text-primary uppercase tracking-widest text-sm mb-6
Descripción:  text-on-surface-variant text-base md:text-lg text-center leading-relaxed
Offset:       Segundo card tiene md:mt-24 (diseño asimétrico intencional)
```

### 4.5 Galería — Grid Masonry-style

```
Grid:        grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6
Items:       aspect-square object-cover rounded-[2rem]
Hover:       opacity-90 transition-opacity shadow-sm
Offset:      Items 2 y 4 tienen lg:mt-12 (efecto escalonado)
```

### 4.6 Inputs (para formularios/chatbot)

```
Style:       Sin fondo (transparent)
Border:      Solo borde inferior → border-b (1px)
Color base:  outline-variant (#D9C1C3) al 20% de opacidad
Focus:       border-primary (#944555) peso 2px
Sin:         borders completos — "ahogan" la estética
```

### 4.7 Chips (Selector de tiempo/servicio)

```
No seleccionado:  surface-variant (#E6E2DF) — sin borde
Seleccionado:     primary (#944555) — sin borde
Text selected:    on-primary (#FFFFFF)
Shape:            rounded-full
```

### 4.8 Footer

```
Border:      border-t border-outline-variant/30
Padding:     pt-12
Layout:      flex flex-col md:flex-row justify-between items-center gap-8
Font:        text-sm font-label text-on-surface-variant
Links social: hover text-primary transition-colors tracking-widest uppercase
```

### 4.9 Secciones / Section Headers

```
Centrado:    text-center mb-20
Título:      text-5xl md:text-6xl font-heading text-on-surface
Descripción: text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto
             font-body leading-relaxed
```

---

## 5. Breakpoints Responsive

Basado en Tailwind CSS v4 (configuración por defecto):

| Breakpoint | Prefijo Tailwind | Ancho mínimo | Descripción                    |
|------------|-----------------|--------------|--------------------------------|
| Mobile     | (sin prefijo)   | 0px          | Base — columna única           |
| Small      | `sm:`           | 640px        | Grid 2 cols en galería         |
| Medium     | `md:`           | 768px        | Grid 2 cols especialistas, nav CTA visible |
| Large      | `lg:`           | 1024px       | Grid 2 cols hero, bento 3 cols |
| XL         | `xl:`           | 1280px       | (reservado para expansión)     |
| 2XL        | `2xl:`          | 1536px       | (reservado para expansión)     |

### Comportamiento por breakpoint clave

**Hero:**
- Mobile: columna única, imagen debajo del texto, `text-6xl`
- md: `text-7xl`
- lg: dos columnas lado a lado (`grid-cols-2 gap-16`), `text-[5rem]`

**Navbar:**
- Mobile: solo logo, sin botón CTA (`hidden`)
- md+: muestra botón "Agendar Cita" (`md:inline-flex`)

**FAB:**
- Mobile: `bottom-8 right-8`
- md+: `bottom-12 right-12`

**Secciones:**
- Mobile: `py-24 px-6`
- md+: `py-32`

---

## 6. Efectos y Micro-animaciones

### Glassmorphism
```css
/* Nav principal */
background: rgba(255, 255, 255, 0.70);
backdrop-filter: blur(12px);

/* FAB (Floating Concierge) */
background: rgba(148, 69, 85, 0.95);  /* primary al 95% */
backdrop-filter: blur(12px);

/* Regla general */
surface-container-lowest al 70–80% + blur(12px)
```

### Transiciones
```css
/* Estándar para todos los hovers */
transition-all duration-300

/* Escala en tarjetas */
hover:scale-[1.02]    /* Fotos de especialistas */
hover:scale-105       /* FAB button */

/* Grises → Color */
grayscale hover:grayscale-0 duration-700  /* Mapa de contacto */

/* Opacidad */
hover:opacity-80       /* Logo */
hover:opacity-90       /* Galería */
```

### Sombras (Ambient Shadows)
```css
/* Uso general — sutil */
shadow-sm

/* FAB */
shadow-xl

/* Para elementos de alta importancia (confirmaciones) */
box-shadow: 0 20px 40px rgba(62, 2, 21, 0.06);
/* Nunca usar grey puro — usar tinte de on-primary-fixed */
```

### "Ghost Border" (campo input accesible)
```css
border-color: rgba(217, 193, 195, 0.20);  /* outline-variant al 20% */
/* En focus →  */
border-color: #944555;  /* primary al 100% */
border-width: 2px;
```

---

## 7. Reglas de Diseño "Do's and Don'ts"

### ✅ DO — Aplicar siempre

- **Asimetría intencional**: Segundo especialista con `md:mt-24` para romper el "template" visual.
- **Micro-interacciones**: Fades suaves de 300ms ease-out para todos los hovers.
- **Tono sobre tono**: Usar `on-surface-variant` (#534245) para texto secundario — nunca `#000000`.
- **Italic en Noto Serif**: Para énfasis emocional en frases clave (`"nuestro arte."`, `"de trabajos"`).
- **Espacio como feature**: Si algo se siente apretado → duplicar el spacing.
- **Label uppercase**: Todos los labels de botones y metadatos deben ser `uppercase + tracking-widest`.
- **Separación por color de fondo**: Alternar entre `surface` y `surface-container-low` para delimitar secciones.

### ❌ DON'T — Prohibido

- **Bordes de 1px sólidos** para separar secciones — "rompen" el efecto premium.
- **Sombras estándar de Material Design** (1dp, 2dp, 4dp) — demasiado pesadas.
- **Negro puro `#000000`** — usar `on-surface` (#1C1B1A) para texto.
- **Llenar el espacio** — si una sección se ve "ocupada", agregar más padding.
- **Centrar todo** — la alineación izquierda con espacio derecho amplio transmite galería de lujo.
- **Opacidad 100% en outline-variant** para bordes — máximo 20% de opacidad.

---

## 8. Capturas de Referencia — Pantallas del Proyecto SDB (Stitch)

> Las siguientes imágenes son capturas directas del proyecto **SDB** en Stitch, accesibles vía URL de Google Stitch.
> Proyecto ID: `11255442433182969819`

### 8.1 Landing Page — Hero Section
![Landing Page Hero](https://lh3.googleusercontent.com/aida/ADBb0ujZIgxCAXl71q3axCddLjdXbIRv2zbkw18M3Bf41Tri4mJf90N90Y4GxPEfdxCaFID3VpYN0JJRYsQkvVyrgL1ns0OnmEKG3p5xyoKptzGb3HaCU4Z7FtyDK7OQw_lepBZJlr2akPuKoyTw-6Wc3nD-MSb8ute8ZCPdphB2Sy3eRkCb4a4xC9cn28Y-iQ9G5vykQzz46AC-GaoWL4ik6NOqjwY5sNAxGa6xPJhOyurnRwBAX1wLBZcqN5k)
*Hero: grid 2 columnas en desktop, imagen 4:5 con border-radius 3rem, tipografía display en Noto Serif italic para el span de acento.*

### 8.2 Services Section — Bento Grid
![Services Section](https://lh3.googleusercontent.com/aida/ADBb0uiqYN-4RpriOIxY2ROUWm8fo1Mh5PI9YAJ1axTxVypUb--OKJuB0BgL3J6HDgfiovR5lDZ9vOcfRgLyRosuEboEn3uo0g0ZTxL5rlV1tKOvwVAxKV24PP8PqZUlxWEZLJz5McS11w7hGS-UKGKKLCLgOqhKz53ppf2fVipDjd17Bwyqgyq4KQs-jZiokAjB1Ib2RI2bmFKdf4tvb2wqqM_B8Ueq4PAsrqnrqZp1ZHC2BTshjd2oqzEXgvJB)
*Bento: 3 columnas en desktop, cards redondeadas 2.5rem, íconos en círculos primary-fixed, separación por color de fondo (bg-surface-container-low).*

### 8.3 Specialists Section
![Specialists Section](https://lh3.googleusercontent.com/aida/ADBb0uibaq7vJU_LW0T7SghfJJ5eYZPWiJm-U79rwqJUVJLGA3mJRiyb2dyeNognlX_hXNRZg_wW_tDVRqd35a3PApTKIEG7xOqUeQdz00pPnZ58BhH1zaI8u0k1JQ-0uUYfFcCva1IVhmNeK1yxlRjg2jWK77L88yZK1n5JD_q-_9OcoSyC8RqZn3mBXoMAiPjbQnidK42A8EneTDM0MAPQmz50BmMszTzNGPihvRBE2eyjwB0i95K19hYcupk)
*Especialistas: grid 2 columnas, segundo card con offset md:mt-24 (asimetría intencional), imágenes 3:4, label de especialidad en primary uppercase.*

### 8.4 Gallery Section
![Gallery Section](https://lh3.googleusercontent.com/aida/ADBb0ujOk0AOJiROmZ-z5JfZnbCfBQTUQNMSDTVAEMTHt_Y5SaYXPMgbBOtuASVYtdlNCPccE90wA430eJNb-y_2sClbEV5t123g7AquerOiIZluY3eJwGEZZYJFwR0Z8qDqHEpjgG09RFrh4aFip8mJ_6Xjt5SJeDFnlLLFVKa1WY5HE1yqyx6sL64unte9twmjLIMgraelxXGju3Qd880TFTawYrNet9rUf1ET2du0NA3dGTz4WtERQ8_c9gLp)
*Galería: 4 columnas en desktop, efecto escalonado (lg:mt-12 en cols 2 y 4), aspecto cuadrado, rounded-[2rem], fondo surface-container-high.*

### 8.5 Booking Chatbot Widget
![Booking Chatbot](https://lh3.googleusercontent.com/aida/ADBb0ugU-0dCRmsRUnAfrWrWzmuUYUO0o746q-nEVxnXcfQtY8oeDRZXWs4bkQf8Iqn9ijhimLecKhkL05gAW0ZV_G_wqSECD4jw0an1m1VG-C44iGsG8g01-FyQiHwzA4imi7qexm29wnFEVhYaM_eOBwPpSiJRth0k5etKi76cmxcH6c7YHXRmo9LBeYQlCS_MB9ZzvdWd8NnvBGluglMv4rHjRde8x9MtuUWwP2NUwl8gaJ5bp6mlkeAWf5Nh)
*Chatbot widget: flujo por botones, chips de selección, inputs ghost, fondo surface.*

### 8.6 Admin Dashboard
![Admin Dashboard](https://lh3.googleusercontent.com/aida/ADBb0ug5xI7NY7kwvO7u5uWd0-SUopyba3Ju6rarKrTY2cRAPkRdhCJ4Qm8YNodl3X23zj51YIsVOykmgTfEusF0R_sq6T3yZ_2axGVDeI1nloRDPmM6qS_1iWCs0dS8QOXvQLfo1yC5cByxELQR6XrKF7ubCUp3B5oLnVh7o7ipMTsd-pT1GpSRqt5tX3QnC3zYGCC3ICu9cBnQdGW7X73gpl6_mG8Tug77Y---NbJUh2KGdLHpv6lQkAajilRq)
*Admin panel: sidebar nav, grid de tarjetas de estadística, tabla de citas del día.*

---

## 9. Variables CSS — Mapeo Completo

```css
/* Definición en @theme (Tailwind v4) */
@theme {
  /* Primarios */
  --color-primary:                  #944555;
  --color-primary-container:        #E8899A;
  --color-primary-fixed:            #FFD9DE;
  --color-primary-fixed-dim:        #FFB2BE;
  --color-on-primary:               #FFFFFF;
  --color-on-primary-container:     #682233;
  --color-on-primary-fixed:         #3E0215;
  --color-on-primary-fixed-variant: #772E3E;
  --color-inverse-primary:          #FFB2BE;

  /* Secundarios */
  --color-secondary:                #7D5630;
  --color-secondary-container:      #FFCA9B;
  --color-secondary-fixed:          #FFDCBF;
  --color-secondary-fixed-dim:      #F0BD8F;
  --color-on-secondary:             #FFFFFF;
  --color-on-secondary-container:   #7A532E;
  --color-on-secondary-fixed:       #2D1600;
  --color-on-secondary-fixed-variant: #623F1B;

  /* Terciarios */
  --color-tertiary:                 #7B5455;
  --color-tertiary-container:       #C79999;
  --color-tertiary-fixed:           #FFDAD9;
  --color-tertiary-fixed-dim:       #ECBBBA;
  --color-on-tertiary:              #FFFFFF;
  --color-on-tertiary-container:    #523132;
  --color-on-tertiary-fixed:        #2F1314;
  --color-on-tertiary-fixed-variant: #603D3E;

  /* Superficies */
  --color-surface:                  #FDF8F5;
  --color-surface-bright:           #FDF8F5;
  --color-surface-dim:              #DED9D6;
  --color-surface-tint:             #944555;
  --color-surface-variant:          #E6E2DF;
  --color-surface-container-lowest: #FFFFFF;
  --color-surface-container-low:    #F8F3F0;
  --color-surface-container:        #F2EDEA;
  --color-surface-container-high:   #ECE7E4;
  --color-surface-container-highest:#E6E2DF;

  /* On-Surface */
  --color-on-surface:               #1C1B1A;
  --color-on-surface-variant:       #534245;
  --color-background:               #FDF8F5;
  --color-on-background:            #1C1B1A;

  /* Inversos */
  --color-inverse-surface:          #32302E;
  --color-inverse-on-surface:       #F5F0ED;

  /* Outline */
  --color-outline:                  #867274;
  --color-outline-variant:          #D9C1C3;

  /* Error */
  --color-error:                    #BA1A1A;
  --color-error-container:          #FFDAD6;
  --color-on-error:                 #FFFFFF;
  --color-on-error-container:       #93000A;

  /* Tipografía */
  --font-heading: 'Noto Serif', serif;
  --font-body:    'Plus Jakarta Sans', sans-serif;
  --font-label:   'Plus Jakarta Sans', sans-serif;
}
```

---

## 10. Referencia Rápida — Secciones Landing Page

| Sección          | Fondo                    | py      | Layout desktop       |
|------------------|--------------------------|---------|----------------------|
| **Nav**          | glass-nav (white/70%)    | h-24    | flex justify-between |
| **Hero**         | `surface` (#FDF8F5)      | pt-24 pb-20 | grid-cols-2 gap-16 |
| **Servicios**    | `surface-container-low`  | py-24 md:py-32 | grid-cols-3 gap-6  |
| **Especialistas**| `surface`                | py-24 md:py-32 | grid-cols-2 gap-16–20 |
| **Galería**      | `surface-container-high` | py-24 md:py-32 | grid-cols-4 gap-6  |
| **Contacto**     | `surface`                | py-24 md:py-32 | grid-cols-2 gap-20 |
| **Footer**       | `surface` (integrado)    | pt-12   | flex justify-between |

---

*Documento generado: 2026-03-31 | Fuente: Stitch Project SDB (ID: 11255442433182969819) + codebase SALONDEBELLEZAWEB*
