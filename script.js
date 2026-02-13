// author-v5 Portfolio Logic - Feb 1 Version (Updated)
document.addEventListener('DOMContentLoaded', () => {

    const galleryAssetsLoaded = (typeof galleryAssets !== 'undefined');
    if (!galleryAssetsLoaded) {
        console.error("galleryAssets not found! Check gallery_data.js");
        return;
    }

    // --- Helpers ---
    const filterAsset = (slug, excludeSlug = null) => {
        if (!slug) return [];
        // Even more robust normalization
        const clean = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        const normSlug = clean(slug);
        const normExclude = excludeSlug ? clean(excludeSlug) : null;

        return galleryAssets.filter(p => {
            const normPath = clean(p);
            // Relaxed matching: looks for the slug anywhere in the normalized path
            const isMatch = normPath.includes(normSlug);
            const isMedia = p.toLowerCase().endsWith('.mp4') || p.toLowerCase().endsWith('.mov') || p.toLowerCase().endsWith('.pdf');
            const isLogo = p.toLowerCase().includes('logo-');
            const isExcluded = normExclude && normPath.includes(normExclude);
            return isMatch && !isMedia && !isLogo && !isExcluded;
        });
    };

    // --- Visual Subtabs System (New Windows Flow) ---
    function setupVisualSubtabs(sectionId, subtabConfigs) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const menuContainer = section.querySelector('.sub-tabs-container');
        if (!menuContainer) return;

        menuContainer.innerHTML = '';
        subtabConfigs.forEach(conf => {
            const images = filterAsset(conf.slug, conf.exclude);
            if (images.length === 0) {
                console.warn(`No images for slug: ${conf.slug}`);
                return;
            }

            // Create Visual Button
            const vBtn = document.createElement('div');
            vBtn.className = 'subtab-visual-btn';
            vBtn.innerHTML = `
                <div class="visual-btn-slideshow"></div>
                <div class="visual-btn-overlay">
                    <h3>${conf.name}</h3>
                </div>
            `;

            const slideshow = vBtn.querySelector('.visual-btn-slideshow');
            const previewSet = images.slice(0, 8);
            previewSet.forEach((path, idx) => {
                const slide = document.createElement('div');
                slide.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
                slide.style.backgroundImage = `url('${path}')`;
                slideshow.appendChild(slide);
            });

            // Mini Slideshow Logic
            let cur = 0;
            const slides = slideshow.querySelectorAll('.hero-slide');
            if (slides.length > 1) {
                setInterval(() => {
                    slides[cur].classList.remove('active');
                    cur = (cur + 1) % slides.length;
                    slides[cur].classList.add('active');
                }, 3000 + Math.random() * 2000);
            }

            vBtn.onclick = () => showSubtabGallery(sectionId, conf.id, images, conf.name, conf.children || []);
            menuContainer.appendChild(vBtn);
        });
    }

    function showSubtabGallery(sectionId, subtabId, images, title, children = []) {
        const section = document.getElementById(sectionId);
        const menu = section.querySelector('.sub-tabs-container');
        const contents = section.querySelectorAll('.sub-tab-content');

        menu.style.display = 'none';
        contents.forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });

        const target = section.querySelector(`#subtab-${subtabId}`);
        if (!target) return;

        const root = target.querySelector('.subtab-gallery-root');

        target.style.display = 'block';
        target.classList.add('active');

        // Render Base with Back Button and optional Sub-Nav
        root.innerHTML = `
            <button class="btn-back-galleries"><i class="fas fa-arrow-left"></i> Volver a ${title}</button>
            <div class="sub-nav-bar" style="display: ${children.length > 0 ? 'flex' : 'none'}; justify-content: center; gap: 1rem; margin-bottom: 4rem; flex-wrap: wrap;"></div>
            <div class="gallery-grid"></div>
        `;

        root.querySelector('.btn-back-galleries').onclick = () => {
            target.style.display = 'none';
            menu.style.display = 'grid';
            window.scrollTo({ top: section.offsetTop - 100, behavior: 'smooth' });
        };

        const grid = root.querySelector('.gallery-grid');
        const subNav = root.querySelector('.sub-nav-bar');

        const renderItems = (pool) => {
            grid.innerHTML = '';
            const sortedImages = [...pool].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            sortedImages.forEach((path, idx) => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                const img = document.createElement('img');
                img.src = path;
                img.loading = "lazy";
                img.onclick = () => window.openLightbox(sortedImages, idx);
                item.appendChild(img);
                grid.appendChild(item);
            });
        };

        if (children.length > 0) {
            children.forEach(child => {
                const btn = document.createElement('button');
                btn.className = 'sub-tab-btn';
                btn.innerText = child.name;
                btn.onclick = () => {
                    subNav.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderItems(filterAsset(child.slug));
                };
                subNav.appendChild(btn);
            });
            // Auto-click first child
            subNav.querySelector('.sub-tab-btn').click();
        } else {
            renderItems(images);
        }

        window.scrollTo({ top: section.offsetTop - 50, behavior: 'smooth' });
    }

    // --- Navigation ---
    const tabBtns = document.querySelectorAll('.nav-tabs li');
    const tabContents = document.querySelectorAll('.tab-content');
    const burger = document.querySelector('.burger');
    const navTabs = document.querySelector('.nav-tabs');

    // Shutter sound with fallback
    const shutterSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1433/1433-preview.mp3');
    const localShutter = new Audio('assets/shutter.mp3');

    // Natural Sort Helper
    const naturalSort = (a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            // Shutter sound with multiple tries
            localShutter.play().catch(() => shutterSound.play().catch(() => console.log("Audio blocked")));

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                const menu = c.querySelector('.sub-tabs-container');
                if (menu) menu.style.display = 'grid';
                const subContents = c.querySelectorAll('.sub-tab-content');
                subContents.forEach(sc => sc.style.display = 'none');
            });

            btn.classList.add('active');
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (targetId === 'inicio') document.body.classList.add('on-home');
            else document.body.classList.remove('on-home');

            if (navTabs && navTabs.classList.contains('nav-active')) {
                navTabs.classList.remove('nav-active');
                if (burger) burger.classList.remove('toggle');
            }
        });
    });

    if (burger) {
        burger.addEventListener('click', () => {
            navTabs.classList.toggle('nav-active');
            burger.classList.toggle('toggle');
        });
    }

    // --- Lightbox ---
    const lb = document.getElementById('lightbox-v3');
    const lbImg = document.getElementById('lb-img-v3');
    const lbVideo = document.getElementById('lb-video-v3');
    const lbLocalVideo = document.getElementById('lb-local-video'); // New element
    const lbCaption = document.getElementById('lb-caption');
    const nextFn = lb ? lb.querySelector('.lb-next') : null;
    const prevFn = lb ? lb.querySelector('.lb-prev') : null;

    let currentGallery = [];
    let currentIndex = 0;

    window.openLightbox = (list, index = 0, description = "") => {
        if (!lb) return;
        currentGallery = list;
        currentIndex = index;
        updateLightboxContent(description);
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function checkArrows() {
        if (currentGallery.length <= 1) {
            if (nextFn) nextFn.style.display = 'none';
            if (prevFn) prevFn.style.display = 'none';
        } else {
            if (nextFn) nextFn.style.display = 'block';
            if (prevFn) prevFn.style.display = 'block';
        }
    }

    function updateLightboxContent(descOverride = "") {
        const item = currentGallery[currentIndex];
        // Check types: 'video' (embed), 'local-video', or default (image)
        const type = (typeof item === 'object') ? (item.type || 'image') : 'image';
        const src = (typeof item === 'object') ? item.src : item;
        const desc = descOverride || (typeof item === 'object' ? item.caption : "") || "";

        // Reset all
        lbImg.style.display = 'none';
        lbVideo.style.display = 'none';
        if (lbLocalVideo) {
            lbLocalVideo.style.display = 'none';
            lbLocalVideo.pause();
            lbLocalVideo.src = ""; // Stop buffer
        }
        lbVideo.src = ""; // Stop iframe

        if (type === 'video') {
            lbVideo.style.display = 'block';
            lbVideo.src = src;
        } else if (type === 'local-video' && lbLocalVideo) {
            lbLocalVideo.style.display = 'block';
            lbLocalVideo.src = src;
            lbLocalVideo.play().catch(() => { });
        } else {
            lbImg.style.display = 'block';
            lbImg.src = src;
        }

        if (lbCaption) {
            lbCaption.innerText = desc;
            lbCaption.style.display = desc ? 'block' : 'none';
        }
        checkArrows();
    }

    if (lb) {
        lb.querySelector('.close-lb').onclick = () => {
            lb.classList.remove('active');
            lbVideo.src = "";
            if (lbLocalVideo) {
                lbLocalVideo.pause();
                lbLocalVideo.src = "";
            }
            document.body.style.overflow = '';
        };

        if (nextFn) nextFn.onclick = (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % currentGallery.length;
            updateLightboxContent();
        };
        if (prevFn) prevFn.onclick = (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
            updateLightboxContent();
        };

        lb.onclick = (e) => {
            if (e.target === lb || e.target.classList.contains('lb-main')) {
                lb.classList.remove('active');
                lbVideo.src = "";
                document.body.style.overflow = '';
            }
        };
    }

    // --- Initialize ---

    // 1. Landing Hero (ACCELERATED 1.2s)
    // 1. Landing Hero (Updated: Includes Logos + 2s Interval)
    const heroSlides = document.getElementById('hero-slideshow');
    if (heroSlides) {
        // Find the specific logos we want to include
        const specificLogos = galleryAssets.filter(p => p.includes('Logo Rony'));

        // Filter the rest of the pool, excluding the specific logos we already found (to avoid duplicates if logic changes)
        // and excluding other "logo-" files we don't want.
        const pool = galleryAssets.filter(p =>
            !p.includes('Logo Rony') &&
            !p.toLowerCase().includes('logo-') &&
            (p.toLowerCase().endsWith('.jpg') || p.toLowerCase().endsWith('.jpeg') || p.toLowerCase().endsWith('.png'))
        );

        // Pick 23 random images from the pool
        const randomSelection = pool.sort(() => Math.random() - 0.5).slice(0, 23);

        // Combine specific logos + random selection
        const finalSlides = [...specificLogos, ...randomSelection];

        // Shuffle the combined list so logos appear at random positions
        const shuffled = finalSlides.sort(() => Math.random() - 0.5);

        shuffled.forEach((path, idx) => {
            const slide = document.createElement('div');
            const isLogo = path.toLowerCase().includes('logo rony');
            slide.className = `hero-slide ${idx === 0 ? 'active' : ''} ${isLogo ? 'hero-slide-logo' : ''}`;
            slide.style.backgroundImage = `url('${path}')`;
            heroSlides.appendChild(slide);
        });

        let cur = 0;
        setInterval(() => {
            const slides = heroSlides.querySelectorAll('.hero-slide');
            if (slides.length <= 1) return;
            slides[cur].classList.remove('active');
            cur = (cur + 1) % slides.length;
            slides[cur].classList.add('active');
        }, 2000); // Changed to 2000ms (2 seconds)
    }

    // 2. Video
    const videoGrid = document.getElementById('video-grid-v3');
    const videoHighlight = document.getElementById('video-highlight-v3');
    if (videoGrid) {
        // Local Videos
        const vids = galleryAssets.filter(p => (p.endsWith('.mp4') || p.endsWith('.mov')) && p.includes('1 Videos'));
        const main = vids.find(v => v.includes('rony_vivas_fotografo'));

        if (main && videoHighlight) {
            videoHighlight.innerHTML = `
                <div class="video-hero-layout" style="display: flex; flex-wrap: wrap; align-items: center; gap: 4rem; margin-bottom: 4rem; max-width: 1200px; margin-left: auto; margin-right: auto;">
                    <div class="video-container" style="flex: 1 1 450px; position: relative;">
                         <video controls muted autoplay loop style="width:100%; border-radius: 4px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);"><source src="${main}"></video>
                         <div class="main-video-caption" style="opacity: 1; bottom: -30px; left: 0; padding: 0; background: none; font-size: 0.8rem; color: #888; border: none;">Trabajo fotográfico para TV Fit</div>
                    </div>
                    <div class="text-container" style="flex: 1 1 400px; color: #ccc;">
                        <h3 style="color: #fff; font-family: var(--font-heading); font-size: 2.2rem; margin-bottom: 1.5rem; letter-spacing: 1px;">Contenido Visual que Comunica</h3>
                        <p style="margin-bottom: 1.5rem; line-height: 1.8; font-size: 1.05rem;">
                            "Desde la narrativa cinematográfica hasta la inmediatez de las redes sociales, transformo ideas en historias de alto impacto. Ofrezco realización integral para marcas y eventos corporativos, así como creación de contenido estratégico para plataformas digitales.
                        </p>
                        <p style="line-height: 1.8; font-size: 1.05rem;">
                            Contamos con equipos de producción propios, lo que nos permite garantizar excelencia técnica, tiempos de entrega ágiles y una estética profesional en cada proyecto."
                        </p>
                    </div>
                </div>
            `;
        }

        // Render Local Videos (excluding main)
        vids.filter(v => v !== main).forEach(v => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            let captionText = v.split('/').pop().replace(/\.[^/.]+$/, "").replace(/_/g, " ");
            // Custom Override for Rori
            if (captionText.toLowerCase().includes('rori')) {
                captionText = "Rori";
            }

            // Using autoplay muted loop for "silent view" in grid
            item.innerHTML = `
                <div style="position: relative; width: 100%; height: 100%;">
                    <video autoplay loop muted playsinline width="100%" style="height: 100%; object-fit: cover; display: block;" src="${v}"></video>
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); padding: 5px; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                        <i class="fas fa-volume-mute" style="color: white; font-size: 0.8rem;"></i>
                    </div>
                </div>
                <div style="padding: 10px; text-align: center; font-size: 0.8rem; letter-spacing: 1px; color: #aaa;">${captionText}</div>
            `;

            // Add click to open in lightbox with sound
            item.style.cursor = 'pointer';
            item.onclick = () => {
                window.openLightbox([{ type: 'local-video', src: v, caption: captionText }], 0);
            };

            videoGrid.appendChild(item);
        });

        // Instagram / External Videos List
        // Filtered Unique Links
        const uniqueLinks = [
            "https://www.instagram.com/p/CidRO_qJvSl/", // 1. Moto Prev
            "https://www.instagram.com/p/CwBtlagMKYn/", // 2. Cruz Diez
            "https://www.instagram.com/p/DT4N_ovDOx4/", // 3. (New)
            "https://www.instagram.com/p/DB72YhUxLvp/"  // 4. (New)
        ];

        const instagramVideos = uniqueLinks.map((link) => {
            const parts = link.split('/');
            const id = parts[4] || parts[3];
            // Use captioned embed for better visual structure
            const embedSrc = `https://www.instagram.com/p/${id}/embed/captioned/`;

            return {
                link: link,
                embedSrc: embedSrc
            };
        });

        console.log('Rendering ' + instagramVideos.length + ' Instagram cards');

        // Render Instagram Cards
        instagramVideos.forEach(vid => {
            const item = document.createElement('div');
            item.className = 'gallery-item instagram-card';
            item.style.cursor = 'pointer';
            item.style.position = 'relative'; // Ensure layout context
            item.style.overflow = 'hidden';   // Crop excess iframe parts
            item.style.background = '#000'; // Fallback background

            // Debug log
            console.log('Adding card for:', vid.link);

            // Use Iframe as "Thumbnail" + Transparent Overlay for Click
            // pointer-events: none on iframe to prevent interaction inside grid
            // Increased height slightly to hide potential scrollbars or controls
            item.innerHTML = `
                <iframe src="${vid.embedSrc}" frameborder="0" scrolling="no" allowtransparency="true" style="width: 100%; height: 120%; margin-top: -10%; pointer-events: none; object-fit: cover;"></iframe>
                <div class="insta-click-mask" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; background: transparent; display: flex; align-items: center; justify-content: center;">
                    <i class="fab fa-instagram" style="color: white; opacity: 0; transition: opacity 0.3s; font-size: 3rem; text-shadow: 0 2px 5px rgba(0,0,0,0.5);"></i>
                </div>
            `;

            // Hover effect for icon
            item.onmouseenter = () => { item.querySelector('i').style.opacity = '1'; };
            item.onmouseleave = () => { item.querySelector('i').style.opacity = '0'; };

            item.onclick = () => {
                // Open directly in Instagram
                window.open(vid.link, '_blank');
            };
            videoGrid.appendChild(item);
        });
    }

    // 3. Comercial
    setupVisualSubtabs('comercial', [
        { id: 'comercial-corporativo', slug: 'Corporativo', name: 'Corporativos' },
        {
            id: 'comercial-deportivas',
            slug: 'Deportivas',
            name: 'Deportivas',
            children: [
                { name: 'Yoga (Cori Urosa)', slug: 'Cori Urosa' },
                { name: 'Funcionales', slug: 'Funcionales' },
                { name: 'Regata', slug: 'Regata' }
            ]
        },
        { id: 'comercial-menu', slug: 'Menu Pedidos Ya', name: 'Pedidos ya/Menú' },
        { id: 'comercial-avilas', slug: 'Avilas', name: 'Ávilas' }
    ]);

    // 4. Retratos
    setupVisualSubtabs('retratos', [
        { id: 'retratos-angel', slug: 'angel', name: 'Angel Caido' },
        { id: 'retratos-indestructible', slug: 'indestructible', name: 'Indestructible' },
        { id: 'retratos-luz', slug: 'luz_que_llevamos', name: 'La Luz que Llevamos' },
        { id: 'retratos-estudio', slug: 'estudio', name: 'Retratos de Estudio' }
    ]);

    // 5. Documental
    setupVisualSubtabs('documental', [
        { id: 'doc-caruao', slug: 'caruao', name: 'Caruao' },
        { id: 'doc-tigre', slug: 'tigre', name: 'El Tigre' },
        { id: 'doc-gallera', slug: 'gallera', name: 'Gallera Caracas' },
        { id: 'doc-madrid', slug: 'madrid', name: 'Madrid' },
        { id: 'doc-padre', slug: 'padre', name: 'Padre e Hijo' },
        { id: 'doc-yugo', slug: 'yugo', name: 'Yugo Heredado' }
    ]);

    // 6. Trabajos Personales
    setupVisualSubtabs('trabajos-personales', [
        { id: 'tp-diegesis', slug: 'diegesis', name: 'Diegesis' },
        { id: 'tp-estenopeicas', slug: 'estenopeicas', name: 'Estenopeicas', exclude: 'diegesis' },
        {
            id: 'tp-digital',
            slug: 'fotografia digital',
            name: 'Fotografía Digital',
            children: [
                { name: 'Lecerca', slug: 'Lecerca' },
                { name: 'Legado', slug: 'Legado' },
                { name: 'Muñecas', slug: 'Muñecas' }
            ]
        }
    ]);

    // --- Interactive Video (Bio) ---
    const profileVideo = document.getElementById('profile-video');
    if (profileVideo) {
        profileVideo.muted = true; // Ensure muted for autoplay policies
        profileVideo.pause();
        window.addEventListener('scroll', () => {
            const bio = document.getElementById('bio');
            if (profileVideo.duration && bio.classList.contains('active')) {
                const rect = bio.getBoundingClientRect();
                const winH = window.innerHeight;
                if (rect.top < winH && rect.bottom > 0) {
                    const progress = (winH - rect.top) / (winH + rect.height);
                    profileVideo.currentTime = Math.min(Math.max(progress, 0), 1) * profileVideo.duration;
                }
            }
        });
    }
});
