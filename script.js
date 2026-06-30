/**
 * BarberKing – script.js
 * Funcionalidades: navbar scroll, menú mobile, reveal animations,
 * contador de stats, galería con filtros y lightbox, sistema de turnos,
 * formulario de contacto.
 */

'use strict';

/* ============================================================
   1. NAVBAR — fijo y cambio de estilo al scroll
   ============================================================ */
const navbar    = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

// Agregar clase .scrolled cuando se supera los 60px de scroll
function handleNavbarScroll() {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

// Menú mobile — toggle abierto/cerrado
function toggleMobileMenu() {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

// Cerrar menú al hacer click en un enlace
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('scroll', handleNavbarScroll, { passive: true });
navToggle.addEventListener('click', toggleMobileMenu);
handleNavbarScroll(); // Ejecutar al cargar

/* ============================================================
   2. REVEAL ANIMATIONS — Intersection Observer
   ============================================================ */
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Escalonar las animaciones con un pequeño delay
        const delay = (index % 4) * 100;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

revealElements.forEach(el => revealObserver.observe(el));

/* ============================================================
   3. CONTADOR ANIMADO DE ESTADÍSTICAS
   ============================================================ */
const statNumbers = document.querySelectorAll('.stat-number[data-target]');
let statsAnimated = false;

/**
 * Anima un número desde 0 hasta el valor target
 * @param {HTMLElement} el - Elemento a animar
 * @param {number} target - Valor objetivo
 * @param {number} duration - Duración en ms
 */
function animateCounter(el, target, duration = 1800) {
  let startTime = null;
  const startValue = 0;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    // Easing: ease-out cuadrático
    const eased = 1 - (1 - progress) * (1 - progress);
    const current = Math.floor(eased * target);

    // Formatear con separador de miles
    el.textContent = current >= 1000
      ? '+' + (current / 1000).toFixed(current >= 10000 ? 0 : 1) + 'K'
      : '+' + current;

    if (progress < 1) requestAnimationFrame(step);
    else {
      // Valor final formateado
      el.textContent = target >= 1000
        ? '+' + (target / 1000).toFixed(0) + 'K'
        : '+' + target;
    }
  }
  requestAnimationFrame(step);
}

// Observar la sección "nosotros" para disparar el contador
const aboutSection = document.getElementById('nosotros');
if (aboutSection) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !statsAnimated) {
        statsAnimated = true;
        statNumbers.forEach(el => {
          const target = parseInt(el.dataset.target, 10);
          animateCounter(el, target);
        });
        statsObserver.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  statsObserver.observe(aboutSection);
}

/* ============================================================
   4. GALERÍA — Filtros y Lightbox
   ============================================================ */
const filterBtns  = document.querySelectorAll('.filter-btn');
const galleryGrid = document.getElementById('galleryGrid');

// Filtrado de categorías
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Actualizar botón activo
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const filter = btn.dataset.filter;
    const items  = galleryGrid.querySelectorAll('.gallery-item');

    items.forEach((item, i) => {
      const match = filter === 'all' || item.dataset.category === filter;
      if (match) {
        item.classList.remove('hidden');
        item.style.transitionDelay = `${(i % 5) * 50}ms`;
      } else {
        item.classList.add('hidden');
        item.style.transitionDelay = '0ms';
      }
    });
  });
});

// Lightbox — abrir al hacer click en una tarjeta
const lightbox        = document.getElementById('lightbox');
const lightboxClose   = document.getElementById('lightboxClose');
const lightboxContent = document.getElementById('lightboxContent');

function openLightbox(card) {
  const overlay  = card.querySelector('.gallery-overlay');
  const tag      = card.dataset.categoryLabel || (overlay ? overlay.querySelector('.gallery-tag')?.textContent : '');
  const name     = card.dataset.title || (overlay ? overlay.querySelector('.gallery-name')?.textContent : '');
  const imageSrc = card.dataset.image || '';

  lightboxContent.innerHTML = `
    <div class="lightbox-media">
      <img src="${imageSrc}" alt="${name}" />
    </div>
    <div class="lightbox-info">
      <span class="lightbox-tag">${tag}</span>
      <p class="lightbox-name">${name}</p>
    </div>
  `;

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

// Delegar click en las tarjetas de galería
galleryGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.gallery-card');
  if (card) openLightbox(card);
});

lightboxClose.addEventListener('click', closeLightbox);

// Cerrar al hacer click fuera del contenido
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

/* ============================================================
   5. SISTEMA DE TURNOS
   ============================================================ */

/**
 * Estructura de datos de turnos por día.
 * Estado: 'available' | 'reserved'
 * En producción, esta data vendría de una API / Google Calendar.
 */
const scheduleData = {
  lunes: [
    { time: '09:00', status: 'available' },
    { time: '10:00', status: 'reserved'  },
    { time: '11:00', status: 'available' },
    { time: '12:00', status: 'available' },
    { time: '13:00', status: 'reserved'  },
    { time: '14:00', status: 'reserved'  },
    { time: '15:00', status: 'available' },
    { time: '16:00', status: 'available' },
    { time: '17:00', status: 'reserved'  },
    { time: '18:00', status: 'available' },
    { time: '19:00', status: 'available' },
  ],
  martes: [
    { time: '09:00', status: 'reserved'  },
    { time: '10:00', status: 'available' },
    { time: '11:00', status: 'reserved'  },
    { time: '12:00', status: 'reserved'  },
    { time: '13:00', status: 'available' },
    { time: '14:00', status: 'available' },
    { time: '15:00', status: 'available' },
    { time: '16:00', status: 'reserved'  },
    { time: '17:00', status: 'available' },
    { time: '18:00', status: 'reserved'  },
    { time: '19:00', status: 'available' },
  ],
  miercoles: [
    { time: '09:00', status: 'available' },
    { time: '10:00', status: 'available' },
    { time: '11:00', status: 'reserved'  },
    { time: '12:00', status: 'available' },
    { time: '13:00', status: 'available' },
    { time: '14:00', status: 'reserved'  },
    { time: '15:00', status: 'reserved'  },
    { time: '16:00', status: 'available' },
    { time: '17:00', status: 'available' },
    { time: '18:00', status: 'available' },
    { time: '19:00', status: 'reserved'  },
  ],
  jueves: [
    { time: '09:00', status: 'reserved'  },
    { time: '10:00', status: 'reserved'  },
    { time: '11:00', status: 'available' },
    { time: '12:00', status: 'reserved'  },
    { time: '13:00', status: 'available' },
    { time: '14:00', status: 'available' },
    { time: '15:00', status: 'reserved'  },
    { time: '16:00', status: 'available' },
    { time: '17:00', status: 'reserved'  },
    { time: '18:00', status: 'available' },
    { time: '19:00', status: 'available' },
  ],
  viernes: [
    { time: '09:00', status: 'available' },
    { time: '10:00', status: 'reserved'  },
    { time: '11:00', status: 'reserved'  },
    { time: '12:00', status: 'reserved'  },
    { time: '13:00', status: 'reserved'  },
    { time: '14:00', status: 'available' },
    { time: '15:00', status: 'available' },
    { time: '16:00', status: 'reserved'  },
    { time: '17:00', status: 'reserved'  },
    { time: '18:00', status: 'available' },
    { time: '19:00', status: 'reserved'  },
  ],
  sabado: [
    { time: '09:00', status: 'available' },
    { time: '10:00', status: 'available' },
    { time: '11:00', status: 'reserved'  },
    { time: '12:00', status: 'available' },
    { time: '13:00', status: 'reserved'  },
    { time: '14:00', status: 'available' },
    { time: '15:00', status: 'reserved'  },
    { time: '16:00', status: 'reserved'  },
    { time: '17:00', status: 'available' },
  ],
};

const slotsGrid  = document.getElementById('slotsGrid');
const dayBtns    = document.querySelectorAll('.day-btn');

/**
 * Renderizar los turnos de un día específico
 * @param {string} day - Clave del día en scheduleData
 */
function renderSlots(day) {
  const slots = scheduleData[day] || [];
  slotsGrid.innerHTML = '';

  slots.forEach((slot, index) => {
    const el = document.createElement('div');
    el.className = `slot-item ${slot.status}`;
    el.setAttribute('role', slot.status === 'available' ? 'button' : 'presentation');
    el.setAttribute('tabindex', slot.status === 'available' ? '0' : '-1');
    el.setAttribute('aria-label', `${slot.time} – ${slot.status === 'available' ? 'Disponible' : 'Reservado'}`);
    el.style.animationDelay = `${index * 40}ms`;
    el.innerHTML = `
      <span class="slot-time">${slot.time}</span>
      <span class="slot-status">${slot.status === 'available' ? 'Disponible' : 'Reservado'}</span>
    `;

    // Al hacer click en un slot disponible, redirigir a WhatsApp con el horario pre-cargado
    if (slot.status === 'available') {
      el.addEventListener('click', () => {
        const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
        const message  = encodeURIComponent(`Hola BarberKing! Quiero reservar el turno del ${dayLabel} a las ${slot.time}hs. 💈`);
        window.open(`https://wa.me/5493513409738?text=${message}`, '_blank', 'noopener');
      });

      // Accesibilidad: activar con teclado
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    }

    slotsGrid.appendChild(el);
  });
}

// Selector de días
dayBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dayBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    renderSlots(btn.dataset.day);
  });
});

// Renderizar el día inicial (Lunes)
renderSlots('lunes');

/* ============================================================
   6. FORMULARIO DE CONTACTO
   ============================================================ */
const contactForm  = document.getElementById('contactForm');
const formSuccess  = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const phone   = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();

    // Validación básica
    if (!name || !phone || !message) {
      alert('Por favor, completá todos los campos.');
      return;
    }

    // Armar el mensaje de WhatsApp con los datos del formulario
    const waMessage = encodeURIComponent(
      `Hola BarberKing! 💈\n\nMi nombre es ${name}.\nTeléfono: ${phone}.\n\n${message}`
    );

    // Mostrar mensaje de éxito
    formSuccess.classList.add('show');
    contactForm.reset();

    // Abrir WhatsApp con el mensaje pre-cargado
    setTimeout(() => {
      window.open(`https://wa.me/5493513409738?text=${waMessage}`, '_blank', 'noopener');
    }, 800);

    // Ocultar el mensaje de éxito después de 5 segundos
    setTimeout(() => {
      formSuccess.classList.remove('show');
    }, 5000);
  });
}

/* ============================================================
   7. SMOOTH SCROLL para anchors nativos — fallback
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offsetTop = target.offsetTop - 80; // Compensar altura del navbar
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   8. HIGHLIGHT link activo del navbar según sección visible
   ============================================================ */
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-link');

function updateActiveNavLink() {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 120;
    if (window.scrollY >= sectionTop) current = section.getAttribute('id');
  });

  navAnchors.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', updateActiveNavLink, { passive: true });

/* ============================================================
   9. PERFORMANCE — Lazy init para las hero lines
   ============================================================ */
// Pausar animación de las líneas decorativas cuando no son visibles
const heroSection = document.getElementById('inicio');
if (heroSection) {
  const heroLines = heroSection.querySelectorAll('.line');
  const heroObserver = new IntersectionObserver(
    (entries) => {
      heroLines.forEach(line => {
        line.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
      });
    },
    { threshold: 0 }
  );
  heroObserver.observe(heroSection);
}

// ─── Inicialización completa ────────────────────────────────
console.log('✦ BarberKing — Web cargada correctamente.');
