admin-servicios:
""
<!DOCTYPE html>

<html class="light" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary-container": "#7a532e",
              "tertiary": "#7b5455",
              "outline-variant": "#d9c1c3",
              "outline": "#867274",
              "surface-container-lowest": "#ffffff",
              "secondary-fixed-dim": "#f0bd8f",
              "on-tertiary-fixed-variant": "#603d3e",
              "primary-fixed-dim": "#ffb2be",
              "primary-container": "#e8899a",
              "on-surface-variant": "#534245",
              "on-primary-fixed": "#3e0215",
              "surface-dim": "#ded9d6",
              "on-tertiary": "#ffffff",
              "secondary-fixed": "#ffdcbf",
              "on-background": "#1c1b1a",
              "inverse-on-surface": "#f5f0ed",
              "surface-container-low": "#f8f3f0",
              "on-error": "#ffffff",
              "inverse-surface": "#32302e",
              "surface-bright": "#fdf8f5",
              "primary-fixed": "#ffd9de",
              "secondary": "#7d5630",
              "on-secondary-fixed": "#2d1600",
              "tertiary-fixed": "#ffdad9",
              "on-tertiary-fixed": "#2f1314",
              "tertiary-fixed-dim": "#ecbbba",
              "surface-container": "#f2edea",
              "background": "#fdf8f5",
              "error": "#ba1a1a",
              "on-primary-fixed-variant": "#772e3e",
              "primary": "#944555",
              "surface-variant": "#e6e2df",
              "surface-container-highest": "#e6e2df",
              "inverse-primary": "#ffb2be",
              "on-surface": "#1c1b1a",
              "error-container": "#ffdad6",
              "on-error-container": "#93000a",
              "on-tertiary-container": "#523132",
              "surface": "#fdf8f5",
              "surface-container-high": "#ece7e4",
              "on-secondary-fixed-variant": "#623f1b",
              "secondary-container": "#ffca9b",
              "on-secondary": "#ffffff",
              "on-primary-container": "#682233",
              "on-primary": "#ffffff",
              "tertiary-container": "#c79999",
              "surface-tint": "#944555"
            },
            fontFamily: {
              "headline": ["Noto Serif"],
              "body": ["Plus Jakarta Sans"],
              "label": ["Plus Jakarta Sans"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-shadow {
            box-shadow: 0 20px 40px rgba(62, 2, 21, 0.04);
        }
        body {
            background-color: #FDF8F5;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- SideNavBar Shell -->
<aside class="flex flex-col h-screen fixed left-0 top-0 py-8 px-4 h-full w-64 border-r-0 bg-[#FDF8F5] dark:bg-stone-900 z-50">
<div class="mb-12 px-4">
<h1 class="text-2xl font-serif italic text-[#944555] dark:text-[#E8899A]">L'Élixir</h1>
<p class="font-serif text-sm tracking-wide text-on-surface-variant/60">Admin Dashboard</p>
</div>
<nav class="flex flex-col space-y-2">
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg" href="#">
<span class="material-symbols-outlined">calendar_today</span>
<span>Citas</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#944555] dark:text-[#FFD9DE] font-semibold bg-[#FFFFFF]/50 dark:bg-white/5 rounded-lg font-serif text-lg tracking-wide" href="#">
<span class="material-symbols-outlined">content_cut</span>
<span>Servicios</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg" href="#">
<span class="material-symbols-outlined">face_3</span>
<span>Especialistas</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg" href="#">
<span class="material-symbols-outlined">group</span>
<span>Clientes</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg mt-auto" href="#">
<span class="material-symbols-outlined">settings</span>
<span>Configuración</span>
</a>
</nav>
</aside>
<!-- TopNavBar Shell -->
<header class="fixed top-0 right-0 left-64 h-20 flex items-center justify-between px-8 z-40 bg-[#FFFFFF]/70 dark:bg-stone-900/70 backdrop-blur-md">
<div class="flex items-center bg-surface-container rounded-full px-4 py-2 w-96">
<span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
<input class="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-on-surface-variant/50" placeholder="Buscar servicios..." type="text"/>
</div>
<div class="flex items-center gap-6">
<button class="relative text-[#534245] hover:text-[#944555] transition-opacity">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
</button>
<div class="flex items-center gap-3 pl-6 border-l border-outline-variant/20">
<div class="text-right">
<p class="text-sm font-medium text-on-surface">Admin Profile</p>
<p class="text-xs text-on-surface-variant">Manage Salon</p>
</div>
<div class="h-10 w-10 rounded-full overflow-hidden bg-surface-container">
<img alt="Administrator Profile" class="h-full w-full object-cover" data-alt="professional headshot of a woman with elegant minimalist jewelry and a confident warm expression in soft studio lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfjW9p3dJmXV7REmy0K5clRb_0UYJrUAJxeTRNcCknQa4Bw_hoUdmlgIa3uHFCVkl6ogjmlxaAI6m_Mm6G1rgW2pnHy3Wrl1S6kLq4og5BjzgDcsmy2fGfWS-Pa8VZP51On2LJHEYUpM6LLyyVSxnrT--P157tUyjKPRUjLgri_HBaBiDmi38hWRC_QJOTuWGHV7Xrit9losIJRFJ42eaPLr30gzUSv6xcRC_IAO_KhYb1tsl4-sVkP-vpj4Bo6r-sFvaYsp4N-vDh"/>
</div>
</div>
</div>
</header>
<!-- Main Content -->
<main class="ml-64 pt-24 pb-12 px-12 min-h-screen">
<!-- Header Section -->
<section class="flex justify-between items-end mb-12">
<div>
<nav class="flex text-xs text-on-surface-variant/60 uppercase tracking-widest mb-2 space-x-2">
<span>Admin</span>
<span>/</span>
<span class="text-primary font-semibold">Servicios</span>
</nav>
<h2 class="font-headline text-4xl text-on-primary-fixed">Servicios</h2>
</div>
<button class="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-3 rounded-full hover:bg-secondary-fixed transition-all duration-300 font-label font-bold text-sm tracking-wider uppercase editorial-shadow">
<span class="material-symbols-outlined">add</span>
                Nuevo Servicio
            </button>
</section>
<!-- Bento Grid Layout for Services -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<!-- Service Card 1 -->
<div class="group bg-surface-container-lowest p-6 rounded-xl editorial-shadow transition-all duration-300 hover:-translate-y-1">
<div class="aspect-[16/9] w-full mb-6 overflow-hidden rounded-lg">
<img alt="Tinte service" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="close-up of professional hair coloring process with luxury products and soft steam in a high-end salon atmosphere" src="https://lh3.googleusercontent.com/aida-public/AB6AXuABSHnK5fID0iAoZxZbPtppTanPkymQbUx5GaBSFiy9T7_xRgt5Z7PsHAIdq2K9bTshyGaZ1uCvI3ZX3I4HdG-rXR4qApjJHatVBO-9ktl3nxqHYzI81vk5i91yNwBtWvGVv9-OqrZXasP5S8SylwEw1QTjZHUGvyw5z8VpCLoo72j0j1ixO9a2_h7LCPxNi_p0LO4dHGST2rTbJQO0sZbP8KSeRHsayT8XJosLeutldyB3H12_2BAw9698bc6JI_m_6GO-EKFEb68w"/>
</div>
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline text-xl text-on-surface mb-1">Tinte Personalizado</h3>
<div class="flex gap-2 text-xs text-on-surface-variant/70 uppercase tracking-tighter">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> 120 min</span>
</div>
</div>
<span class="font-label font-bold text-lg text-primary">$85.000</span>
</div>
<p class="text-sm text-on-surface-variant mb-6 line-clamp-2 italic">Coloración premium con extractos botánicos para un brillo duradero y salud capilar.</p>
<div class="flex items-center justify-between pt-6 border-t border-outline-variant/20">
<div class="flex -space-x-3">
<img alt="Lucía" class="w-8 h-8 rounded-full border-2 border-white object-cover" data-alt="portrait of a stylist with short hair and modern glasses" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvupNSc1SHHgx5WH40Fcz5HWr2-1emUi0UVK-qidXPIV9a3ILplovSF9qOpjhlflh-IVIIwhShCx20mMVNz6zM-lMO6NqjDWqWVFYBWqHmqnLs09FE04je11zakZFLVY3KmF7Dd_1OBTgEGG4CD2uEwNyvLR5BLCH-b71s_2ssDsD3UxCPJ9cWpXDC2sWsrr1b-N_R_HVPlvgnoOj1voYn___C0z5NFDq64k4i1iudFXannzFi0TJt3_fNdwa14kLnXB3zgzrUMOkN"/>
<img alt="Elena" class="w-8 h-8 rounded-full border-2 border-white object-cover" data-alt="portrait of a young female stylist with braids" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOuIyxEpWYgPhEkbQb7ylsTAk3eNqBART3fcskzNoZY1O_cHc4_mK2u9CyIlSglwOH5IbxWjjOCCJ14WfGUirIUFLk7jlRB94mR1mkkgDhoWBxRLOyk2mdp1N3ykh9x8137fhK9XMib7ClyAjH-4zpg-STH1iIj98k-WzbvlXIOQ6R617-TGuYxeEOC4iY5xVKgK1K6aSQCvTrpV1EtgFiVURF4kQTKSmSOpWBNuLLN9KNfrx2NxQoGvZ9Gh-zby2XI7fA4bJdo_kE"/>
<div class="w-8 h-8 rounded-full border-2 border-white bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant">+2</div>
</div>
<div class="flex gap-2">
<button class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 rounded-full transition-colors">
<span class="material-symbols-outlined">edit</span>
</button>
<button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-full transition-colors">
<span class="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
<!-- Service Card 2 -->
<div class="group bg-surface-container-lowest p-6 rounded-xl editorial-shadow transition-all duration-300 hover:-translate-y-1">
<div class="aspect-[16/9] w-full mb-6 overflow-hidden rounded-lg">
<img alt="Manicure service" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="meticulous manicure process with soft pink nail polish being applied in a clean bright studio setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrdqqSVkWehz5HVMcmQOZ83_jWa-2tIwLTnZlumaNuNi2hMPlmoA3-DtGHgcf5eoXZrskxNi5WBBm0IhICisGsns4jr5CEtqDyNTXnZg5vDvAtaCCkKekUzH_djclfY0dq2aASVhWXUO9hN02-UkB_ZBJ2jQux7eotuKLaj4EvvHtNgrXk581I7I2JcUYzF8rI6WMNH5rbHF7xFAvLR7AW9FYgdmaYoFm0Lgkdr9NX1nAHbxFys5KqGstAHx7G4Bif1-hUnwHqwfC-"/>
</div>
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline text-xl text-on-surface mb-1">Manicure Spa</h3>
<div class="flex gap-2 text-xs text-on-surface-variant/70 uppercase tracking-tighter">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> 60 min</span>
</div>
</div>
<span class="font-label font-bold text-lg text-primary">$45.000</span>
</div>
<p class="text-sm text-on-surface-variant mb-6 line-clamp-2 italic">Tratamiento completo de uñas que incluye exfoliación con sales marinas y masaje relajante.</p>
<div class="flex items-center justify-between pt-6 border-t border-outline-variant/20">
<div class="flex -space-x-3">
<img alt="Specialist" class="w-8 h-8 rounded-full border-2 border-white object-cover" data-alt="portrait of a specialist with long wavy hair" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6fkG8WWMvijH1-A56ZfyZsMom5RaYs4dQFEGozPrqmqmTYHLtuZf4h8HGYZyBIRcg1RhuBt0a-OfDgyvwErdVmvw00fNBBilOWe9LFE1eILT8j2MX9t2omqbwca6G7_WAl8lvVIt-96BUnE_p7ZL4YZSJO0HAkaY5PbhGm1azklFkl3PM99LpXK1Sct5JvmVxMFvNXP6BHQhxtlMZWY9Qmog0yqZiUChJrncMwRyJjQs-i8J9VyJp_1N0GaVkclWTvIxmdBr3VUqA"/>
<img alt="Specialist" class="w-8 h-8 rounded-full border-2 border-white object-cover" data-alt="portrait of a focused professional therapist" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBimd7Pdv-8LSM3X4-HFsZN_CDmDBU6DyjCfpWThXgSgc1SCTRokGBhKcsGzIdyN9pJTzIBhaREn3rJI22UEFcvlo-p6lE8a8ZEwA8kRYzjF0IumqTHkQB5HF7ySUkOkxFzh6XSbMBn7K3duxHJ6wMFMeYDz7Ne0xUtQbFCHPGvIBdD81fSTkjlAegQp3L7QcPdKK2sej8wVVp-bNjbweK0Y8rQ8h01Y2IFXyo6s4pSycmDrVmQm4fUpXyp_C_HSwjhf4n3hc9n6Xt4"/>
</div>
<div class="flex gap-2">
<button class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 rounded-full transition-colors">
<span class="material-symbols-outlined">edit</span>
</button>
<button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-full transition-colors">
<span class="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
<!-- Service Card 3 -->
<div class="group bg-surface-container-lowest p-6 rounded-xl editorial-shadow transition-all duration-300 hover:-translate-y-1">
<div class="aspect-[16/9] w-full mb-6 overflow-hidden rounded-lg">
<img alt="Balayage service" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="luxury hair wash station with aromatic steam and high-end botanical treatment products on display" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWSEp-B5gp7ISgjI1BVDj2KYisFEmP4nqlfIMzD_Yhr19kRG-zDQCM4VC10xn65kXiYAOvJ00eYOk6_G6uleLGg0uIulS4AJLVu1BSfqxs_ybYzIbZdUKD4iEJzFx-6S_5HuLe8R4zBdv2OD5XLIjiFpRh8kQU3rThfBkGyswJNzvGvb1_74SUc9qOijpKFySyzPwSU-iEcqjCGiZYaQlaTgA2NJuupyTzX7ioxizMwU6iixknz13LZCNX4ENsBNL0OavP3y_1CpOu"/>
</div>
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline text-xl text-on-surface mb-1">Balayage Signature</h3>
<div class="flex gap-2 text-xs text-on-surface-variant/70 uppercase tracking-tighter">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> 180 min</span>
</div>
</div>
<span class="font-label font-bold text-lg text-primary">$210.000</span>
</div>
<p class="text-sm text-on-surface-variant mb-6 line-clamp-2 italic">Técnica de aclarado a mano alzada para un degradado natural "besado por el sol".</p>
<div class="flex items-center justify-between pt-6 border-t border-outline-variant/20">
<div class="flex -space-x-3">
<img alt="Lucía" class="w-8 h-8 rounded-full border-2 border-white object-cover" data-alt="portrait of a stylist with short hair and modern glasses" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjH-km_tYEnqwzU2-mte2C8kV9kMKG1Thv0zBXWAUX0ZZMHciOCTyvA8snXGQT6jMreOzieNm3C8jofgaEOImE1wx8uCP34esuRKuNQtTRjQzSKm6HiyyyKilmMGaqnsy4MucPRFccMkKtLOZzdkefwJCV1sQiiMwCdh8zEr9YRQOPQJN1mgR4oDrQWJn3e7EwstULKjy46mTv-xRJUROJBbRlGqiL4Zlk7LQ3bpkzJRB3h9qeDNZ-Ajy11atu5htjMflav6K8zoT2"/>
</div>
<div class="flex gap-2">
<button class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 rounded-full transition-colors">
<span class="material-symbols-outlined">edit</span>
</button>
<button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-full transition-colors">
<span class="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
<!-- Service Card 4 -->
<div class="group bg-surface-container-lowest p-6 rounded-xl editorial-shadow transition-all duration-300 hover:-translate-y-1">
<div class="aspect-[16/9] w-full mb-6 overflow-hidden rounded-lg">
<img alt="Facial service" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="aesthetic display of premium skincare products and facial treatment tools on a stone surface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOvmxIA-Mz0VQhTzodbpM3Tyar_wkbpx6zdzTLpTKzWbVPR98HhGSWfEm22-xeD5iYsznas7pkEj-Mg5jL6F6OhT01ZeomJzZRN9HkW8ik-NaRPHqicpwC4pRJ-CHKO-ofNS5ifeUlQnIazG4zGrwcgvrq8btDZ3edWM2OF-KQJgUkHyey_0s3RP6wBJmry_qZPjMdQBOb_b-MbIA8OPdCE4ro81WvuijzbdHxU84VpFg3zpDy5TwVpk7_h8u0xW0amlRXu3fQ1qS0"/>
</div>
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline text-xl text-on-surface mb-1">Hidratación Profunda</h3>
<div class="flex gap-2 text-xs text-on-surface-variant/70 uppercase tracking-tighter">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> 45 min</span>
</div>
</div>
<span class="font-label font-bold text-lg text-primary">$65.000</span>
</div>
<p class="text-sm text-on-surface-variant mb-6 line-clamp-2 italic">Tratamiento facial intensivo con ácido hialurónico y mascarilla de oro.</p>
<div class="flex items-center justify-between pt-6 border-t border-outline-variant/20">
<div class="flex -space-x-3">
<img alt="Elena" class="w-8 h-8 rounded-full border-2 border-white object-cover" data-alt="portrait of a young female stylist with braids" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRsnzeQlscImbQQfFDB3xRz7k2b13PM0Teleh6nOGunDs9-rI9et7RoRDA3ICHmF986JGrew5htFeAEts4xprEfQHaAHtiRBqNBK6xoacPn0bSLEjN1JL2LFhj-f6It4TarnM9w7whEEkVIbFtLC39zH-2up5RLnXdYQ-Xji-qzbYF6Bxmlm4NQ04r_tW-JzoNR64pgCE-5c0ipftMxDyIGD9i2CQBRnwPFGGi2dSnTes8Bo7DtmvRLBt93JVHlAINEF9x_WNVi0Cf"/>
</div>
<div class="flex gap-2">
<button class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30 rounded-full transition-colors">
<span class="material-symbols-outlined">edit</span>
</button>
<button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-full transition-colors">
<span class="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
<!-- Add Service Placeholder -->
<button class="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-xl p-12 hover:bg-white transition-all duration-300 group">
<div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-4xl">add_circle</span>
</div>
<span class="font-headline text-xl text-on-surface-variant/60">Añadir Nuevo</span>
<span class="text-xs font-label uppercase tracking-widest text-on-surface-variant/40 mt-2">Crea una nueva categoría</span>
</button>
</div>
<!-- Pagination / Summary -->
<div class="mt-16 flex items-center justify-between">
<p class="text-sm text-on-surface-variant font-medium">Mostrando 4 de 24 servicios registrados</p>
<div class="flex gap-2">
<button class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface disabled:opacity-30" disabled="">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<button class="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/20">1</button>
<button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface">2</button>
<button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface">3</button>
<button class="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</main>
<!-- Floating Actions Container -->
<div class="fixed bottom-8 right-8 flex flex-col gap-4">
<button class="w-14 h-14 bg-surface-container-lowest text-primary rounded-full editorial-shadow flex items-center justify-center hover:scale-110 transition-transform">
<span class="material-symbols-outlined">help_outline</span>
</button>
</div>
</body></html>""""



admin-especialistas:

<!DOCTYPE html>

<html class="light" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary-container": "#7a532e",
              "tertiary": "#7b5455",
              "outline-variant": "#d9c1c3",
              "outline": "#867274",
              "surface-container-lowest": "#ffffff",
              "secondary-fixed-dim": "#f0bd8f",
              "on-tertiary-fixed-variant": "#603d3e",
              "primary-fixed-dim": "#ffb2be",
              "primary-container": "#e8899a",
              "on-surface-variant": "#534245",
              "on-primary-fixed": "#3e0215",
              "surface-dim": "#ded9d6",
              "on-tertiary": "#ffffff",
              "secondary-fixed": "#ffdcbf",
              "on-background": "#1c1b1a",
              "inverse-on-surface": "#f5f0ed",
              "surface-container-low": "#f8f3f0",
              "on-error": "#ffffff",
              "inverse-surface": "#32302e",
              "surface-bright": "#fdf8f5",
              "primary-fixed": "#ffd9de",
              "secondary": "#7d5630",
              "on-secondary-fixed": "#2d1600",
              "tertiary-fixed": "#ffdad9",
              "on-tertiary-fixed": "#2f1314",
              "tertiary-fixed-dim": "#ecbbba",
              "surface-container": "#f2edea",
              "background": "#fdf8f5",
              "error": "#ba1a1a",
              "on-primary-fixed-variant": "#772e3e",
              "primary": "#944555",
              "surface-variant": "#e6e2df",
              "surface-container-highest": "#e6e2df",
              "inverse-primary": "#ffb2be",
              "on-surface": "#1c1b1a",
              "error-container": "#ffdad6",
              "on-error-container": "#93000a",
              "on-tertiary-container": "#523132",
              "surface": "#fdf8f5",
              "surface-container-high": "#ece7e4",
              "on-secondary-fixed-variant": "#623f1b",
              "secondary-container": "#ffca9b",
              "on-secondary": "#ffffff",
              "on-primary-container": "#682233",
              "on-primary": "#ffffff",
              "tertiary-container": "#c79999",
              "surface-tint": "#944555"
            },
            fontFamily: {
              "headline": ["Noto Serif"],
              "body": ["Plus Jakarta Sans"],
              "label": ["Plus Jakarta Sans"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      h1, h2, h3 {
        font-family: 'Noto Serif', serif;
      }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- SideNavBar Shell -->
<aside class="flex flex-col h-screen fixed left-0 top-0 py-8 px-4 h-full w-64 border-r-0 bg-[#FDF8F5] dark:bg-stone-900 z-50">
<div class="mb-12 px-4">
<h1 class="text-2xl font-serif italic text-[#944555] dark:text-[#E8899A]">L'Élixir</h1>
<p class="font-serif text-sm tracking-wide text-on-surface-variant opacity-70">Admin Dashboard</p>
</div>
<nav class="flex-1 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined">calendar_today</span>
<span class="font-serif text-lg tracking-wide">Citas</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined">content_cut</span>
<span class="font-serif text-lg tracking-wide">Servicios</span>
</a>
<!-- ACTIVE TAB: Especialistas -->
<a class="flex items-center gap-3 px-4 py-3 text-[#944555] dark:text-[#FFD9DE] font-semibold bg-[#FFFFFF]/50 dark:bg-white/5 rounded-lg scale-95 duration-150 ease-in-out" href="#">
<span class="material-symbols-outlined">face_3</span>
<span class="font-serif text-lg tracking-wide">Especialistas</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined">group</span>
<span class="font-serif text-lg tracking-wide">Clientes</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-serif text-lg tracking-wide">Configuración</span>
</a>
</nav>
</aside>
<!-- TopNavBar Shell -->
<header class="fixed top-0 right-0 left-64 h-20 flex items-center justify-between px-8 z-40 bg-[#FFFFFF]/70 backdrop-blur-md">
<div class="flex items-center flex-1">
<div class="relative w-full max-w-md">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50" placeholder="Buscar especialista..." type="text"/>
</div>
</div>
<div class="flex items-center gap-6">
<button class="relative text-on-surface-variant hover:text-primary transition-opacity">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
</button>
<div class="flex items-center gap-3">
<span class="text-sm font-medium font-body text-on-surface">Admin Profile</span>
<img class="w-10 h-10 rounded-full object-cover shadow-sm" data-alt="professional portrait of a sophisticated businesswoman in a clean white studio with soft lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeBYZZ9YN6M2okmB4rhWuQrsx1zNxid51Mvy72TgKvyp7IRjIB3UvOyzFbm2_nJ4wmEs7HfzS3iOAI8Dk1lJy3Hs0XZx5h4BpqO8VVWA6U_PJrr8_RX2QYaI-1t5dv0bXdpwQK3jlrCDclXhwHHNyKt7MWMIrKGMq1RFeSSQvoGPF62prtZ6W4HEX6jnCTkmJlUWttoPvsjPtXGSYVtOLEkYKA2x0TfQjm6LQ04k9is-Ml04npk1k0YmIBApejPR0VpH7LVHw3mxPl"/>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-64 pt-24 p-8 min-h-screen bg-surface">
<div class="max-w-7xl mx-auto">
<!-- Editorial Header -->
<div class="flex justify-between items-end mb-12">
<div>
<h2 class="text-5xl font-headline text-primary mb-2">Especialistas</h2>
<p class="text-on-surface-variant font-body">Gestiona tu equipo de artistas y profesionales de la belleza.</p>
</div>
<button class="bg-primary text-on-primary px-8 py-3 rounded-full font-label text-sm tracking-widest uppercase hover:opacity-90 transition-all flex items-center gap-2">
<span class="material-symbols-outlined text-sm">add</span>
                    Nuevo Especialista
                </button>
</div>
<!-- Specialist Grid (Bento Style Variation) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<!-- Specialist Card 1 -->
<div class="bg-surface-container-low rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-surface-container-lowest group">
<div class="relative mb-6">
<img class="w-32 h-32 rounded-full object-cover ring-4 ring-primary-fixed-dim" data-alt="close up portrait of a young woman with a warm smile and naturally styled hair in a bright airy studio" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBiTZ-iJ7ZKwjyJVayhXKpindSGdOGqrjmE4xPO7cKwzC5rQ9CQlOHwsNhoEGfL0fD0gSP2Rw-or0ef0DU3ZpRKQuEGKSPW_nUYK1gWB5E4ktNNRd1LjbkFj5e8vt7b1SHEedqot9KgttDhKCqN69DYgT0Er7QeKaoNeA-TrLa1acK8HNC9M21ENaFZ_odGhzql9N0B9ejzE_Rx90QaU15fnVOtlUVZ3Ur9AHA-RzmJA3sHp4VoQAgqrUwmErmDGIAVfuSdI2BuAlJ"/>
<span class="absolute bottom-1 right-1 px-2 py-1 bg-white text-[10px] font-bold text-primary border border-primary-fixed rounded shadow-sm">ACTIVO</span>
</div>
<h3 class="text-2xl font-headline text-on-surface mb-1">Lucía Méndez</h3>
<p class="text-primary font-medium text-sm mb-4">Experta en Colorimetría</p>
<div class="w-full space-y-2 mb-8">
<div class="flex flex-wrap justify-center gap-2">
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Balayage</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Tintura Orgánica</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Tratamientos</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 w-full mt-auto">
<button class="py-3 px-4 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-label uppercase tracking-wider hover:bg-outline-variant/30 transition-colors">Editar</button>
<button class="py-3 px-4 border border-primary text-primary rounded-full text-xs font-label uppercase tracking-wider hover:bg-primary-fixed transition-colors">Asignar</button>
</div>
</div>
<!-- Specialist Card 2 -->
<div class="bg-surface-container-low rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-surface-container-lowest group">
<div class="relative mb-6">
<img class="w-32 h-32 rounded-full object-cover ring-4 ring-primary-fixed-dim" data-alt="vibrant portrait of a friendly woman with elegant makeup and jewelry against a soft warm peach background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCn_e_r1pT_2Aqq__LiUySCTsI9wOLBWifof69hlNx19ppWtc6HzHInMlrsR9IEC6gf-7lQ1X_iwIMmwqHAvVy_lMtoVnzskz6Kay9NI6qCEQVZL4rIoaLKncIZsiDdT-pgtwD1xSoQ5zpWCsX-pc9skL5jr6F0DdIQCz1e2IXkE_C9Wpt6GfD7ZDxVHq7kdHwr10fsu0m-Q6xbzfRVLlD6juAKtfzR9jzuIV0CEnBzBdsEwvZ3rdl2Ruh-oiYVdHDVxnXtmRPBG_X5"/>
<span class="absolute bottom-1 right-1 px-2 py-1 bg-white text-[10px] font-bold text-primary border border-primary-fixed rounded shadow-sm">ACTIVO</span>
</div>
<h3 class="text-2xl font-headline text-on-surface mb-1">Elena Rivera</h3>
<p class="text-primary font-medium text-sm mb-4">Master Stylist &amp; Cut</p>
<div class="w-full space-y-2 mb-8">
<div class="flex flex-wrap justify-center gap-2">
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Corte Dama</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Peinado Gala</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 w-full mt-auto">
<button class="py-3 px-4 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-label uppercase tracking-wider hover:bg-outline-variant/30 transition-colors">Editar</button>
<button class="py-3 px-4 border border-primary text-primary rounded-full text-xs font-label uppercase tracking-wider hover:bg-primary-fixed transition-colors">Asignar</button>
</div>
</div>
<!-- Specialist Card 3 -->
<div class="bg-surface-container-low rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-surface-container-lowest group opacity-80">
<div class="relative mb-6">
<img class="w-32 h-32 rounded-full object-cover ring-4 ring-surface-variant" data-alt="professional portrait of a man in a clean studio setting with neutral colors and soft side lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRhoFhgtf8J3YrsjwTbqt_r2CCOs8kFbkQey1hD3HwH66GRIS82oQ9uC7O_Jm1zLGulSRilAQ5Bwky1vhcmkJFPMLIEGyxmsJ__L4X_0Gj56dbKlJbVc2fQ2nlwGIqsfYd3KEasIYStyiDBaucfXsloc3WQZwNkev3jxJ62QGMwREgPq0FQ4Th-BV6SQHGx6AW9O-HDZfmjqrJCShbQf-wPyimit4xM_BfTRMb7ZtDuvCiuPH8v_HtSaiSZiOQ9m5b0e90883ss6BY"/>
<span class="absolute bottom-1 right-1 px-2 py-1 bg-surface-container text-[10px] font-bold text-on-surface-variant border border-outline-variant rounded shadow-sm">INACTIVO</span>
</div>
<h3 class="text-2xl font-headline text-on-surface mb-1">Marco Torres</h3>
<p class="text-primary font-medium text-sm mb-4">Especialista en Barba</p>
<div class="w-full space-y-2 mb-8">
<div class="flex flex-wrap justify-center gap-2">
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Afeitado</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Spa Facial</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 w-full mt-auto">
<button class="py-3 px-4 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-label uppercase tracking-wider hover:bg-outline-variant/30 transition-colors">Editar</button>
<button class="py-3 px-4 border border-primary text-primary rounded-full text-xs font-label uppercase tracking-wider hover:bg-primary-fixed transition-colors">Asignar</button>
</div>
</div>
<!-- Specialist Card 4 -->
<div class="bg-surface-container-low rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-surface-container-lowest group">
<div class="relative mb-6">
<img class="w-32 h-32 rounded-full object-cover ring-4 ring-primary-fixed-dim" data-alt="close up portrait of a woman with clean skin and soft focus background showing a modern minimalist beauty clinic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuqR53JrawgiiQnOj37IGugWiEehuKnjdPfC1u-u_4r7jllCds1ZQ9tRjNDXIbA23QL8tyAd7dCaJ2DFXAqzN7HO0mnmhIlAqJ918nK-CHLuNzWZ-puSLXHvQsOmupbpDD5FgK9He_2EiR27CdJMJj3brpi2tj4Kxb6WAMAsjom6VtRQ9m9ss2rAh3Ats2d6EAs06rQKGBJjrKdr0zdPzsTiH8mZZDSMeCf7VaAMus2xqZAq8tx8_OGplasr-kQNxFrgEKbiJSuEdv"/>
<span class="absolute bottom-1 right-1 px-2 py-1 bg-white text-[10px] font-bold text-primary border border-primary-fixed rounded shadow-sm">ACTIVO</span>
</div>
<h3 class="text-2xl font-headline text-on-surface mb-1">Sofía Castro</h3>
<p class="text-primary font-medium text-sm mb-4">Dermatocosmiatra</p>
<div class="w-full space-y-2 mb-8">
<div class="flex flex-wrap justify-center gap-2">
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Hydrafacial</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Peeling</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Limpieza</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 w-full mt-auto">
<button class="py-3 px-4 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-label uppercase tracking-wider hover:bg-outline-variant/30 transition-colors">Editar</button>
<button class="py-3 px-4 border border-primary text-primary rounded-full text-xs font-label uppercase tracking-wider hover:bg-primary-fixed transition-colors">Asignar</button>
</div>
</div>
<!-- Specialist Card 5 -->
<div class="bg-surface-container-low rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-surface-container-lowest group">
<div class="relative mb-6">
<img class="w-32 h-32 rounded-full object-cover ring-4 ring-primary-fixed-dim" data-alt="warm portrait of a man with a friendly expression wearing professional attire in a modern interior setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqdyyXura6L6FKnmZEwS2Kwc2mJT2y-g42a9IvnC6l753WOPB2DPT703ILIH7Aukp4pYCqASHuoBwMRlccKQPpun-bXBUW7nUTpB4J8PTQMXKfiucPr0FvUTgfulsbmhRnjxV1JWbFjN95V2OW96Zm5ikhoOrCz228C8DEJ_bWf_B1OYhigaYhAT6IOXYxNOhELOrmJVLmH7ma0gRxUwyFXSN9fuepi5lCg2_Z4K0HR-_T209ZPeH-FI4XHLiA01h7VaXEjSlDnU43"/>
<span class="absolute bottom-1 right-1 px-2 py-1 bg-white text-[10px] font-bold text-primary border border-primary-fixed rounded shadow-sm">ACTIVO</span>
</div>
<h3 class="text-2xl font-headline text-on-surface mb-1">Carlos Ruiz</h3>
<p class="text-primary font-medium text-sm mb-4">Técnico en Uñas</p>
<div class="w-full space-y-2 mb-8">
<div class="flex flex-wrap justify-center gap-2">
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Esculpidas</span>
<span class="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs rounded-full">Nail Art</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 w-full mt-auto">
<button class="py-3 px-4 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-label uppercase tracking-wider hover:bg-outline-variant/30 transition-colors">Editar</button>
<button class="py-3 px-4 border border-primary text-primary rounded-full text-xs font-label uppercase tracking-wider hover:bg-primary-fixed transition-colors">Asignar</button>
</div>
</div>
<!-- Empty State / Add New Card -->
<div class="bg-surface-container border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary transition-colors">
<div class="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-4 group-hover:bg-primary-fixed transition-colors">
<span class="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary">person_add</span>
</div>
<p class="font-serif italic text-on-surface-variant group-hover:text-primary">Añadir nuevo miembro al equipo</p>
</div>
</div>
<!-- Stats Bar - Subtle tonal shift for sectioning -->
<div class="mt-16 bg-surface-container-low rounded-xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8 border-t-0">
<div>
<p class="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-1">Total Equipo</p>
<p class="text-3xl font-headline text-primary">12</p>
</div>
<div>
<p class="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-1">En Servicio</p>
<p class="text-3xl font-headline text-primary">8</p>
</div>
<div>
<p class="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-1">Disponibles</p>
<p class="text-3xl font-headline text-primary">3</p>
</div>
<div>
<p class="text-xs font-label text-on-surface-variant uppercase tracking-widest mb-1">Inactivos</p>
<p class="text-3xl font-headline text-primary">1</p>
</div>
</div>
</div>
</main>
</body></html>


aadmin-clientes:

<!DOCTYPE html>

<html class="light" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary-container": "#7a532e",
              "tertiary": "#7b5455",
              "outline-variant": "#d9c1c3",
              "outline": "#867274",
              "surface-container-lowest": "#ffffff",
              "secondary-fixed-dim": "#f0bd8f",
              "on-tertiary-fixed-variant": "#603d3e",
              "primary-fixed-dim": "#ffb2be",
              "primary-container": "#e8899a",
              "on-surface-variant": "#534245",
              "on-primary-fixed": "#3e0215",
              "surface-dim": "#ded9d6",
              "on-tertiary": "#ffffff",
              "secondary-fixed": "#ffdcbf",
              "on-background": "#1c1b1a",
              "inverse-on-surface": "#f5f0ed",
              "surface-container-low": "#f8f3f0",
              "on-error": "#ffffff",
              "inverse-surface": "#32302e",
              "surface-bright": "#fdf8f5",
              "primary-fixed": "#ffd9de",
              "secondary": "#7d5630",
              "on-secondary-fixed": "#2d1600",
              "tertiary-fixed": "#ffdad9",
              "on-tertiary-fixed": "#2f1314",
              "tertiary-fixed-dim": "#ecbbba",
              "surface-container": "#f2edea",
              "background": "#fdf8f5",
              "error": "#ba1a1a",
              "on-primary-fixed-variant": "#772e3e",
              "primary": "#944555",
              "surface-variant": "#e6e2df",
              "surface-container-highest": "#e6e2df",
              "inverse-primary": "#ffb2be",
              "on-surface": "#1c1b1a",
              "error-container": "#ffdad6",
              "on-error-container": "#93000a",
              "on-tertiary-container": "#523132",
              "surface": "#fdf8f5",
              "surface-container-high": "#ece7e4",
              "on-secondary-fixed-variant": "#623f1b",
              "secondary-container": "#ffca9b",
              "on-secondary": "#ffffff",
              "on-primary-container": "#682233",
              "on-primary": "#ffffff",
              "tertiary-container": "#c79999",
              "surface-tint": "#944555"
            },
            fontFamily: {
              "headline": ["Noto Serif"],
              "body": ["Plus Jakarta Sans"],
              "label": ["Plus Jakarta Sans"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #FDF8F5;
        }
        .editorial-shadow {
            box-shadow: 0 20px 40px rgba(62, 2, 21, 0.06);
        }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- SideNavBar Anchor -->
<aside class="flex flex-col h-screen fixed left-0 top-0 py-8 px-4 h-full w-64 border-r-0 bg-[#FDF8F5] dark:bg-stone-900 z-50">
<div class="mb-10 px-4">
<h1 class="text-2xl font-serif italic text-[#944555] dark:text-[#E8899A]">L'Élixir</h1>
<p class="font-serif text-sm tracking-wide text-on-surface-variant opacity-70">Admin Dashboard</p>
</div>
<nav class="flex-1 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg scale-95 duration-150 ease-in-out" href="#">
<span class="material-symbols-outlined">calendar_today</span>
<span>Citas</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg scale-95 duration-150 ease-in-out" href="#">
<span class="material-symbols-outlined">content_cut</span>
<span>Servicios</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg scale-95 duration-150 ease-in-out" href="#">
<span class="material-symbols-outlined">face_3</span>
<span>Especialistas</span>
</a>
<!-- Active Tab: Clientes -->
<a class="flex items-center gap-3 px-4 py-3 text-[#944555] dark:text-[#FFD9DE] font-semibold bg-[#FFFFFF]/50 dark:bg-white/5 rounded-lg font-serif text-lg tracking-wide scale-95 duration-150 ease-in-out" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">group</span>
<span>Clientes</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 font-serif text-lg tracking-wide rounded-lg scale-95 duration-150 ease-in-out" href="#">
<span class="material-symbols-outlined">settings</span>
<span>Configuración</span>
</a>
</nav>
<div class="mt-auto px-4 pt-4 border-t border-surface-container">
<div class="flex items-center gap-3">
<img alt="Admin Profile" class="w-10 h-10 rounded-full object-cover shadow-sm" data-alt="professional portrait of a confident female salon administrator with a warm smile in a brightly lit modern office setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuwI0Jg6DwZRkXDY7ucrY8T6GxtGxkvTYgyw-FjyomkT2TQ6O3UHT16AuqGFoC12i7MnTrKGxUoYjScfh89UhmXTPlvjTsuBZI4Xmf25h_NYlBLO8V43BTnLT9JqeacB6-zQyKthvjViAR07fvubOaYNp9o7FoHzzwScevMXhS8UgZsV87udus4MXdRT4cbW0YujfwaOR8WWTUdGzICiWxszTa0bqVGc1K2VEBV098YI0vMHCIvpnBMOCK4Bbw9pClfHV1ZgC1ntm0"/>
<div>
<p class="text-xs font-bold text-on-surface">Elena Valery</p>
<p class="text-[10px] text-on-surface-variant">Admin Profile</p>
</div>
</div>
</div>
</aside>
<!-- TopNavBar Anchor -->
<header class="fixed top-0 right-0 left-64 h-20 flex items-center justify-between px-8 z-40 bg-[#FFFFFF]/70 dark:bg-stone-900/70 backdrop-blur-md">
<div class="flex items-center flex-1 max-w-xl">
<div class="relative w-full">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input class="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-1 focus:ring-primary/20 font-body transition-all" placeholder="Buscar clientes por nombre, email o teléfono..." type="text"/>
</div>
</div>
<div class="flex items-center gap-6 ml-8">
<button class="relative text-[#534245] dark:text-stone-400 hover:text-[#944555] transition-opacity">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
</button>
<div class="h-6 w-[1px] bg-outline-variant/30"></div>
<button class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-medium transition-transform active:scale-95 shadow-sm">
<span class="material-symbols-outlined text-sm">add</span>
                Nuevo Cliente
            </button>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-64 pt-24 min-h-screen px-8 pb-12">
<!-- Editorial Header Section -->
<header class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
<div class="space-y-1">
<span class="text-primary font-label text-xs tracking-[0.2em] uppercase">Gestión de</span>
<h2 class="text-4xl font-headline text-on-surface font-light">Clientes</h2>
</div>
<div class="flex gap-4">
<div class="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-3">
<span class="text-xs font-label text-on-surface-variant uppercase">Total Clientes</span>
<span class="text-xl font-headline text-primary">1,284</span>
</div>
<div class="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-3">
<span class="text-xs font-label text-on-surface-variant uppercase">Activos este mes</span>
<span class="text-xl font-headline text-on-secondary-container">342</span>
</div>
</div>
</header>
<!-- Bento Grid Layout for Client Insights & Table -->
<div class="grid grid-cols-1 gap-8">
<!-- Table Container -->
<section class="bg-surface-container-lowest rounded-xl editorial-shadow overflow-hidden">
<div class="p-6 border-b border-surface-container-low flex items-center justify-between">
<h3 class="font-headline text-lg text-on-surface">Base de Datos de Clientes</h3>
<div class="flex gap-2">
<button class="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
<span class="material-symbols-outlined">filter_list</span>
</button>
<button class="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">
<span class="material-symbols-outlined">download</span>
</button>
</div>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low/50">
<th class="px-6 py-4 text-xs font-label text-on-surface-variant uppercase tracking-wider">Cliente</th>
<th class="px-6 py-4 text-xs font-label text-on-surface-variant uppercase tracking-wider">Información de Contacto</th>
<th class="px-6 py-4 text-xs font-label text-on-surface-variant uppercase tracking-wider text-center">Visitas Totales</th>
<th class="px-6 py-4 text-xs font-label text-on-surface-variant uppercase tracking-wider">Última Cita</th>
<th class="px-6 py-4 text-xs font-label text-on-surface-variant uppercase tracking-wider text-right">Acciones</th>
</tr>
</thead>
<tbody class="divide-y-0">
<!-- Row 1 -->
<tr class="group hover:bg-primary-fixed/30 transition-colors duration-200 cursor-pointer">
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<img alt="Isabella Reed" class="w-10 h-10 rounded-full object-cover border-2 border-surface shadow-sm" data-alt="portrait of a young woman with smiling eyes and soft cinematic lighting against a pastel background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6CYpbM8zRHmJwXtDj4G_WUXFfLkPccPmJ8HGyUTd5UKT36-BMR41yJPtZX3n-veWCUo8gLqiqOdXI-qCquHztQ3CwSXl_fP1le8tIQlbMbBSS2r3rEnS3dkmB1HHFcWQ1quGQipQCIwEmKWV4YvWuZwzPqqehDfp3Or2QanMSuFBqYh_iZKV6_fafvc0qaFMgEQ8h72aIpeH9lCr4i8NmqSc5qYplh--WOUmDD0WxRcvtqfg5LmIVa9JNpu0_blbxsbDGriqEhKUi"/>
<div>
<p class="font-medium text-on-surface text-sm">Isabella Reed</p>
<p class="text-[10px] text-primary-container font-semibold uppercase tracking-tight">Miembro Oro</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<div class="text-sm space-y-0.5">
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">mail</span>
                                            isabella.r@example.com
                                        </p>
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">phone</span>
                                            +34 612 345 678
                                        </p>
</div>
</td>
<td class="px-6 py-5 text-center">
<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-primary font-bold text-sm">12</span>
</td>
<td class="px-6 py-5">
<div class="text-sm">
<p class="text-on-surface font-medium">14 Oct, 2023</p>
<p class="text-[11px] text-on-surface-variant">Tratamiento Facial Glow</p>
</div>
</td>
<td class="px-6 py-5 text-right">
<button class="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10 rounded-full">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
<!-- Row 2 -->
<tr class="group hover:bg-primary-fixed/30 transition-colors duration-200 cursor-pointer">
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<img alt="Julian Costa" class="w-10 h-10 rounded-full object-cover border-2 border-surface shadow-sm" data-alt="portrait of a man with clean-shaven face and short hair in professional attire against a blurred neutral background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnn0sVeIWOGaINWPEDK4JyjFrfcUSXyFewC31Z-_l3cqujYyF_YkFpjMTt4s-fN61VEBCJFvzMjqv8GenFAX7AkSxaHMf-vBzga_S0B6K9lmrBL4z0We53x1BN6yIlHVuQvK-1Wl7_NqnaUnPcI56AyX_rPYLosK9XnCZSXPDYax7D_bML4scsxCcWDlxZkhAC1sOeggalw03u6ag8lPdzMW2Ous56yX-_dRwUVq6avribhlYexkIcvZvbtUgh0tgusihQmzymGhb_"/>
<div>
<p class="font-medium text-on-surface text-sm">Julian Costa</p>
<p class="text-[10px] text-on-surface-variant/60 uppercase tracking-tight">Cliente Regular</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<div class="text-sm space-y-0.5">
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">mail</span>
                                            j.costa@gmail.com
                                        </p>
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">phone</span>
                                            +34 688 901 234
                                        </p>
</div>
</td>
<td class="px-6 py-5 text-center">
<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-primary font-bold text-sm">4</span>
</td>
<td class="px-6 py-5">
<div class="text-sm">
<p class="text-on-surface font-medium">02 Nov, 2023</p>
<p class="text-[11px] text-on-surface-variant">Corte de Autor</p>
</div>
</td>
<td class="px-6 py-5 text-right">
<button class="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10 rounded-full">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
<!-- Row 3 -->
<tr class="group hover:bg-primary-fixed/30 transition-colors duration-200 cursor-pointer">
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<img alt="Sophia Lorenza" class="w-10 h-10 rounded-full object-cover border-2 border-surface shadow-sm" data-alt="editorial portrait of a sophisticated woman with elegant makeup and jewelry in soft daylight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjL6KOUqX_aO2kqG5j-G_dzYmgN-rmQW_wvUD9oag5VvgqlID_FdqjdHf6Zonqi4MBGZzY8_818ZVQReLQyGdXw6waH7xIzzx25e4msCV5aQzAhmmxnb52hXQ7tujOdnAGqx7yTrwOvb-VQs4zrcHva6axt_YFBjGjSHxytxI6TQ1l2bnH28zP8Sgow4Ck1Ge2yYfP1YNAvHebi5Piln4RB23_Btw9ogBKy48j9NvAgIRjokcEyg88H9KBSnUmHkAbFlyRUNl4-Mbh"/>
<div>
<p class="font-medium text-on-surface text-sm">Sophia Lorenza</p>
<p class="text-[10px] text-primary-container font-semibold uppercase tracking-tight">Miembro Platinum</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<div class="text-sm space-y-0.5">
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">mail</span>
                                            sophia.l@luxury.com
                                        </p>
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">phone</span>
                                            +34 644 111 222
                                        </p>
</div>
</td>
<td class="px-6 py-5 text-center">
<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-primary font-bold text-sm">28</span>
</td>
<td class="px-6 py-5">
<div class="text-sm">
<p class="text-on-surface font-medium">Hoy, 10:30</p>
<p class="text-[11px] text-primary font-semibold uppercase">En Sesión</p>
</div>
</td>
<td class="px-6 py-5 text-right">
<button class="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10 rounded-full">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
<!-- Row 4 -->
<tr class="group hover:bg-primary-fixed/30 transition-colors duration-200 cursor-pointer">
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<img alt="Marc Esteva" class="w-10 h-10 rounded-full object-cover border-2 border-surface shadow-sm" data-alt="close-up portrait of a young man with a friendly expression and natural outdoor lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp9AGB24_ocZQa2ZdV-9yMTmEhlJWTIwu_DgIFflnMYtaJ2dtSlWEJlMBtoHgPOsiZEB1Q-HMCLXJpYJBUEwS-R3vjGK9RA3-uFcakoleSZ6X5RslUsq0_muhedKFbvgqc_w4BKMfPvmcG_Lh8ZClPcIo3SrCqRidoVw6BuG1CUFCE-FD8wA_Q-yrRQE1Uo-erhepSL-7ZuJuPoRQ20wCXPFjHW8-DQReG3ptHazPOIyiyisqCLUeO-R4qC6SPIu8tjSUrb2kuKVaa"/>
<div>
<p class="font-medium text-on-surface text-sm">Marc Esteva</p>
<p class="text-[10px] text-on-surface-variant/60 uppercase tracking-tight">Nuevo Cliente</p>
</div>
</div>
</td>
<td class="px-6 py-5">
<div class="text-sm space-y-0.5">
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">mail</span>
                                            marc.e@hotmail.com
                                        </p>
<p class="text-on-surface-variant flex items-center gap-2">
<span class="material-symbols-outlined text-xs">phone</span>
                                            +34 600 555 444
                                        </p>
</div>
</td>
<td class="px-6 py-5 text-center">
<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-primary font-bold text-sm">1</span>
</td>
<td class="px-6 py-5">
<div class="text-sm">
<p class="text-on-surface font-medium">30 Oct, 2023</p>
<p class="text-[11px] text-on-surface-variant">Masaje Relajante 60'</p>
</div>
</td>
<td class="px-6 py-5 text-right">
<button class="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10 rounded-full">
<span class="material-symbols-outlined">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<!-- Table Footer / Pagination -->
<div class="p-6 bg-surface-container-low/30 flex items-center justify-between">
<p class="text-xs text-on-surface-variant font-body">Mostrando 1-10 de 1,284 clientes</p>
<div class="flex items-center gap-1">
<button class="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant disabled:opacity-30" disabled="">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<button class="w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-lg text-xs font-bold">1</button>
<button class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-lg text-xs">2</button>
<button class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-lg text-xs">3</button>
<span class="px-2 text-on-surface-variant">...</span>
<button class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-lg text-xs">129</button>
<button class="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</section>
<!-- Asymmetric Secondary Insight Area -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<div class="md:col-span-2 bg-surface-container-high rounded-xl p-8 flex flex-col justify-center relative overflow-hidden">
<div class="relative z-10">
<h4 class="font-headline text-2xl text-primary mb-4 italic">Fidelización &amp; Tendencias</h4>
<p class="text-on-surface-variant font-body text-sm max-w-md leading-relaxed">
                            El 64% de tus clientes han regresado en los últimos 90 días. Tu programa de <span class="text-primary font-bold">Miembros Oro</span> ha incrementado el ticket promedio en un 22% desde su lanzamiento.
                        </p>
<button class="mt-6 text-primary font-label text-xs uppercase tracking-widest border-b border-primary-container pb-1 inline-block hover:border-primary transition-all">Ver informe detallado</button>
</div>
<!-- Decorative Element -->
<div class="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-primary/5 to-transparent flex items-center justify-center">
<span class="material-symbols-outlined text-primary/10 text-[120px]" style="font-variation-settings: 'wght' 100;">loyalty</span>
</div>
</div>
<div class="bg-primary text-on-primary rounded-xl p-8 flex flex-col items-center justify-center text-center editorial-shadow">
<span class="material-symbols-outlined text-4xl mb-4" style="font-variation-settings: 'FILL' 1;">celebration</span>
<h5 class="font-headline text-xl mb-2">Próximos Cumpleaños</h5>
<p class="text-sm opacity-80 mb-6">8 clientes celebran esta semana</p>
<button class="w-full py-3 bg-surface-container-lowest text-primary rounded-full text-xs font-bold uppercase tracking-tighter hover:bg-primary-fixed transition-colors">Enviar Felicitación</button>
</div>
</div>
</div>
</main>
</body></html>


admin-configuracion

<!DOCTYPE html>

<html lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>L'Élixir - Admin Settings</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary-container": "#7a532e",
              "tertiary": "#7b5455",
              "outline-variant": "#d9c1c3",
              "outline": "#867274",
              "surface-container-lowest": "#ffffff",
              "secondary-fixed-dim": "#f0bd8f",
              "on-tertiary-fixed-variant": "#603d3e",
              "primary-fixed-dim": "#ffb2be",
              "primary-container": "#e8899a",
              "on-surface-variant": "#534245",
              "on-primary-fixed": "#3e0215",
              "surface-dim": "#ded9d6",
              "on-tertiary": "#ffffff",
              "secondary-fixed": "#ffdcbf",
              "on-background": "#1c1b1a",
              "inverse-on-surface": "#f5f0ed",
              "surface-container-low": "#f8f3f0",
              "on-error": "#ffffff",
              "inverse-surface": "#32302e",
              "surface-bright": "#fdf8f5",
              "primary-fixed": "#ffd9de",
              "secondary": "#7d5630",
              "on-secondary-fixed": "#2d1600",
              "tertiary-fixed": "#ffdad9",
              "on-tertiary-fixed": "#2f1314",
              "tertiary-fixed-dim": "#ecbbba",
              "surface-container": "#f2edea",
              "background": "#fdf8f5",
              "error": "#ba1a1a",
              "on-primary-fixed-variant": "#772e3e",
              "primary": "#944555",
              "surface-variant": "#e6e2df",
              "surface-container-highest": "#e6e2df",
              "inverse-primary": "#ffb2be",
              "on-surface": "#1c1b1a",
              "error-container": "#ffdad6",
              "on-error-container": "#93000a",
              "on-tertiary-container": "#523132",
              "surface": "#fdf8f5",
              "surface-container-high": "#ece7e4",
              "on-secondary-fixed-variant": "#623f1b",
              "secondary-container": "#ffca9b",
              "on-secondary": "#ffffff",
              "on-primary-container": "#682233",
              "on-primary": "#ffffff",
              "tertiary-container": "#c79999",
              "surface-tint": "#944555"
            },
            fontFamily: {
              "headline": ["Noto Serif"],
              "body": ["Plus Jakarta Sans"],
              "label": ["Plus Jakarta Sans"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .font-serif {
        font-family: 'Noto Serif', serif;
      }
    </style>
</head>
<body class="bg-background text-on-surface">
<!-- SideNavBar Shell Implementation -->
<aside class="flex flex-col h-screen fixed left-0 top-0 py-8 px-4 h-full w-64 border-r-0 bg-[#FDF8F5] dark:bg-stone-900 z-50">
<div class="mb-12 px-4">
<h1 class="text-2xl font-serif italic text-[#944555] dark:text-[#E8899A]">L'Élixir</h1>
<p class="font-serif text-sm tracking-wide text-on-surface-variant opacity-70">Admin Dashboard</p>
</div>
<nav class="flex-1 space-y-2">
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
<span class="font-serif text-lg tracking-wide">Citas</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="content_cut">content_cut</span>
<span class="font-serif text-lg tracking-wide">Servicios</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="face_3">face_3</span>
<span class="font-serif text-lg tracking-wide">Especialistas</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#534245] dark:text-stone-400 hover:text-[#944555] hover:bg-[#F8F3F0] dark:hover:bg-stone-800 transition-colors duration-200 rounded-lg" href="#">
<span class="material-symbols-outlined" data-icon="group">group</span>
<span class="font-serif text-lg tracking-wide">Clientes</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-[#944555] dark:text-[#FFD9DE] font-semibold bg-[#FFFFFF]/50 dark:bg-white/5 rounded-lg transition-colors duration-200" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-serif text-lg tracking-wide">Configuración</span>
</a>
</nav>
<div class="mt-auto px-4 pt-4 border-t border-surface-container opacity-50 text-xs">
            © 2024 L'Élixir Beauty
        </div>
</aside>
<!-- TopNavBar Shell Implementation -->
<header class="fixed top-0 right-0 left-64 h-20 flex items-center justify-between px-8 z-40 bg-[#FFFFFF]/70 dark:bg-stone-900/70 backdrop-blur-md">
<div class="flex items-center bg-surface-container rounded-full px-4 py-2 w-96">
<span class="material-symbols-outlined text-on-surface-variant text-xl mr-2">search</span>
<input class="bg-transparent border-none focus:ring-0 text-sm font-sans w-full text-on-surface" placeholder="Buscar ajustes..." type="text"/>
</div>
<div class="flex items-center gap-6">
<button class="relative text-[#944555] hover:opacity-80 transition-opacity">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary ring-2 ring-white"></span>
</button>
<div class="flex items-center gap-3">
<span class="font-sans text-sm font-medium text-on-surface-variant">Admin Profile</span>
<div class="h-10 w-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden">
<img alt="Administrator Profile" class="w-full h-full object-cover" data-alt="Professional headshot of a female salon administrator with a clean and sophisticated look" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1oAdw3Mhg3gd0whnE2ESL2KK-dhgNOkhu6T_faBzU94DtCx0lCOSXGImJOK6WTmnhOn0nbV1kbQdMlJ1QlZgpP9gMCPvZKwgnm5LyxpAHNGo9f74i_uBhpJUDBWuvdMd7qcZ1SGBNITpMlDSx0fFd-7NW8ch1ujyR_2O3jnSWIA0TkVOEwmfVX2mwZot2Fkt-CtXQtkARnUOEBgXyqotLDFVIcRS3H4Ak3SB46c8GKpHY7t_0wKSoFmBTCuldmECplOGIf4e_X_2L"/>
</div>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="pl-64 pt-20 min-h-screen">
<div class="max-w-5xl mx-auto px-12 py-12">
<!-- Page Header -->
<div class="mb-12">
<h2 class="font-serif text-4xl text-primary font-bold tracking-tight mb-2">Configuración</h2>
<p class="text-on-surface-variant font-body">Personaliza la experiencia de L'Élixir y gestiona las reglas de tu salón.</p>
</div>
<!-- Bento Layout Sections -->
<div class="flex flex-col gap-8">
<!-- Section 1: Business Info -->
<section class="bg-surface-container-low rounded-xl p-8 transition-all hover:bg-surface-container duration-300">
<div class="flex items-center gap-3 mb-8">
<span class="material-symbols-outlined text-primary" data-icon="store">store</span>
<h3 class="font-serif text-xl font-semibold">Información del Negocio</h3>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
<div class="space-y-1">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nombre del Salón</label>
<input class="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-2 transition-all font-body text-on-surface" type="text" value="L'Élixir Beauty Salon"/>
</div>
<div class="space-y-1">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Dirección</label>
<input class="w-full bg-transparent border-t-0 border-x-0 border-b border-outline-variant/30 focus:border-primary focus:ring-0 px-0 py-2 transition-all font-body text-on-surface" type="text" value="Avenida de la Estética 123, Madrid"/>
</div>
<div class="space-y-1 md:col-span-2">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 block">Horarios de Atención</label>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
<div class="bg-surface-container-lowest p-4 rounded-lg">
<span class="text-xs text-on-surface-variant">Lun - Vie</span>
<p class="font-medium text-primary">09:00 - 20:00</p>
</div>
<div class="bg-surface-container-lowest p-4 rounded-lg">
<span class="text-xs text-on-surface-variant">Sábados</span>
<p class="font-medium text-primary">10:00 - 18:00</p>
</div>
<div class="bg-surface-container-lowest p-4 rounded-lg">
<span class="text-xs text-on-surface-variant">Domingos</span>
<p class="font-medium text-outline">Cerrado</p>
</div>
<button class="flex items-center justify-center border border-dashed border-outline-variant rounded-lg text-primary-container hover:bg-primary/5 transition-colors">
<span class="material-symbols-outlined mr-1">edit_calendar</span>
<span class="text-xs font-bold">Editar Horas</span>
</button>
</div>
</div>
</div>
</section>
<!-- Section 2: Booking Rules & Specialized Content -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
<!-- Booking Rules -->
<section class="lg:col-span-2 bg-surface-container-low rounded-xl p-8">
<div class="flex items-center gap-3 mb-8">
<span class="material-symbols-outlined text-primary" data-icon="event_note">event_note</span>
<h3 class="font-serif text-xl font-semibold">Reglas de Reserva</h3>
</div>
<div class="space-y-8">
<div class="flex items-center justify-between">
<div>
<p class="font-medium text-on-surface">Tiempo de cortesía (Buffer)</p>
<p class="text-xs text-on-surface-variant">Minutos entre citas para limpieza y preparación.</p>
</div>
<div class="flex items-center gap-2">
<button class="h-8 w-8 rounded-full border border-outline-variant flex items-center justify-center text-primary">-</button>
<span class="w-12 text-center font-bold">15m</span>
<button class="h-8 w-8 rounded-full border border-outline-variant flex items-center justify-center text-primary">+</button>
</div>
</div>
<div class="space-y-4">
<p class="font-medium text-on-surface">Política de Cancelación</p>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<label class="flex items-center p-4 rounded-lg bg-surface-container cursor-pointer border border-transparent hover:border-primary/20 transition-all">
<input checked="" class="text-primary focus:ring-primary h-4 w-4" name="cancel_policy" type="radio"/>
<div class="ml-3">
<span class="text-sm font-medium block">Flexible</span>
<span class="text-xs opacity-60">Cancelación hasta 2h antes</span>
</div>
</label>
<label class="flex items-center p-4 rounded-lg bg-surface-container cursor-pointer border border-transparent hover:border-primary/20 transition-all">
<input class="text-primary focus:ring-primary h-4 w-4" name="cancel_policy" type="radio"/>
<div class="ml-3">
<span class="text-sm font-medium block">Estricta</span>
<span class="text-xs opacity-60">Cancelación hasta 24h antes</span>
</div>
</label>
</div>
</div>
</div>
</section>
<!-- Notifications Card (Editorial Style) -->
<section class="bg-primary text-on-primary rounded-xl p-8 flex flex-col justify-between overflow-hidden relative">
<!-- Decorative Abstract Shape -->
<div class="absolute -top-12 -right-12 h-32 w-32 bg-primary-container/20 rounded-full blur-2xl"></div>
<div>
<div class="flex items-center gap-3 mb-6">
<span class="material-symbols-outlined" data-icon="notifications_active">notifications_active</span>
<h3 class="font-serif text-xl font-semibold">Notificaciones</h3>
</div>
<div class="space-y-6 relative z-10">
<div class="flex items-center justify-between">
<span class="text-sm font-body">WhatsApp Automático</span>
<button class="w-10 h-5 bg-primary-container rounded-full relative flex items-center px-1">
<div class="bg-on-primary w-3 h-3 rounded-full ml-auto"></div>
</button>
</div>
<div class="flex items-center justify-between">
<span class="text-sm font-body">Email Confirmación</span>
<button class="w-10 h-5 bg-primary-container rounded-full relative flex items-center px-1">
<div class="bg-on-primary w-3 h-3 rounded-full ml-auto"></div>
</button>
</div>
<div class="flex items-center justify-between">
<span class="text-sm font-body">Recordatorio 1h Antes</span>
<button class="w-10 h-5 bg-white/20 rounded-full relative flex items-center px-1">
<div class="bg-on-primary w-3 h-3 rounded-full"></div>
</button>
</div>
</div>
</div>
<div class="mt-8 pt-6 border-t border-white/10">
<p class="text-[10px] uppercase tracking-widest opacity-80 mb-2">Template Activo</p>
<p class="text-xs italic font-serif">"Hola {nombre}, te esperamos en L'Élixir a las {hora}..."</p>
</div>
</section>
</div>
<!-- Section 3: Payments & Integrations -->
<section class="bg-surface-container-low rounded-xl p-8 border border-transparent hover:border-outline-variant/10 transition-all">
<div class="flex items-center justify-between mb-10">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary" data-icon="payments">payments</span>
<h3 class="font-serif text-xl font-semibold">Pagos y Transacciones</h3>
</div>
<span class="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Seguro</span>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
<!-- Left: Payment Methods -->
<div class="space-y-6">
<p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Métodos de Cobro</p>
<div class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest transition-transform hover:-translate-y-1">
<div class="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
<span class="material-symbols-outlined">payments</span>
</div>
<div class="flex-1">
<div class="flex items-center justify-between">
<span class="font-medium">Pago en el Local</span>
<input checked="" class="rounded text-primary focus:ring-primary border-outline-variant" type="checkbox"/>
</div>
<p class="text-xs text-on-surface-variant mt-1">El cliente paga directamente al finalizar el servicio.</p>
</div>
</div>
<div class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest transition-transform hover:-translate-y-1">
<div class="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
<span class="material-symbols-outlined">credit_card</span>
</div>
<div class="flex-1">
<div class="flex items-center justify-between">
<span class="font-medium">Pago Online (Seña)</span>
<input class="rounded text-primary focus:ring-primary border-outline-variant" type="checkbox"/>
</div>
<p class="text-xs text-on-surface-variant mt-1">Requerir un pago del 30% para confirmar el turno.</p>
</div>
</div>
</div>
<!-- Right: Integration with Mercado Pago -->
<div class="bg-surface-container p-6 rounded-2xl flex flex-col justify-center">
<div class="flex items-center gap-4 mb-6">
<div class="bg-white p-3 rounded-lg shadow-sm">
<img alt="Fintech Logo" class="h-8 w-8 object-contain" data-alt="Minimalist abstract blue and light blue gradient representing digital payment systems and fintech reliability" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMe6NBgokEEa--NxsHUkLP2tMHCKAf8vykiFKhAmfnBPsAz5I6l9fYTha1PyruZcO_EqG49UQhxAxN8Lhp_vqoQfUD9COMrQcXGZrA6hVmgcBZtgm_f2lEjE0GDDdOACD4U5NhNr4nhYOisR3iXkScIiYdKgj7qkaBcyPn1gPZ1hCOsTmEnmVJikljTUScFgb2zKwlUXe0Zyi0r8QE5kKmS78bn6G8bWu2_qoCaVr-BspvogrsNaqPdXb207Hiq0t_sgCDaUXva63J"/>
</div>
<div>
<h4 class="font-bold text-on-surface">Mercado Pago</h4>
<p class="text-[10px] text-primary uppercase font-bold tracking-tighter">Desconectado</p>
</div>
</div>
<p class="text-sm text-on-surface-variant mb-6 font-body leading-relaxed">Conecta tu cuenta de Mercado Pago para empezar a recibir pagos online y señas de forma automática.</p>
<button class="w-full bg-primary text-on-primary font-bold py-3 rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2 group">
<span>Conectar Cuenta</span>
<span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</div>
</section>
</div>
<!-- Persistent Save Bar (Floating Concierge Style) -->
<div class="fixed bottom-8 left-1/2 -translate-x-1/2 ml-32 w-max bg-surface-container-lowest/80 backdrop-blur-xl border border-white/20 shadow-2xl px-10 py-4 rounded-full flex items-center gap-12 z-50">
<div class="flex flex-col">
<span class="text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em]">Estado</span>
<span class="text-xs text-secondary font-medium">Cambios sin guardar</span>
</div>
<div class="h-8 w-[1px] bg-outline-variant/30"></div>
<div class="flex gap-4">
<button class="px-6 py-2 rounded-full text-on-surface-variant text-sm font-medium hover:bg-surface-variant transition-colors">Descartar</button>
<button class="bg-primary text-on-primary px-8 py-2 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Guardar Ajustes</button>
</div>
</div>
</div>
</main>
</body></html>


