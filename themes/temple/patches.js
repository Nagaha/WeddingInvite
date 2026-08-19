(function () {
  const CONFIG_PATH = '/config.json';
  let config = null;

  function getBasePath() {
    const currentPath = window.location.pathname;
    const themeIndex = currentPath.indexOf('/themes/');
    if (themeIndex !== -1) {
      return currentPath.substring(0, currentPath.indexOf('/themes/'));
    }
    return '';
  }

  function getAssetPath(path) {
    if (path.startsWith('/')) {
      return getBasePath() + path;
    }
    return path;
  }

  async function loadConfig() {
    try {
      const response = await fetch(getAssetPath(CONFIG_PATH));
      if (!response.ok) throw new Error('Config not found');
      config = await response.json();
      return config;
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  function updateNames() {
    if (!config) return;
    const groom = config.couple.groomName;
    const bride = config.couple.brideName;
    const fullNames = `${groom} & ${bride}`;

    document.querySelectorAll('[data-name="couple"]').forEach(el => {
      el.textContent = fullNames;
    });
    document.querySelectorAll('[data-name="groom"]').forEach(el => {
      el.textContent = groom;
    });
    document.querySelectorAll('[data-name="bride"]').forEach(el => {
      el.textContent = bride;
    });
    document.title = `${fullNames} - Wedding Invitation`;
  }

  function updateHero() {
    if (!config) return;
    const heroBg = document.querySelector('[data-hero-bg]');
    if (!heroBg) return;

    function setHeroImage() {
      const isMobile = window.innerWidth <= 768;
      const path = isMobile ? config.photos.hero.mobile : config.photos.hero.desktop;
      heroBg.style.backgroundImage = `url('${getAssetPath(path)}')`;
    }

    setHeroImage();
    window.addEventListener('resize', setHeroImage);

    const dateEl = document.querySelector('[data-wedding-date]');
    if (dateEl) dateEl.textContent = config.wedding.displayText;
  }

  function updateCountdown() {
    if (!config) return;
    const weddingDate = new Date(`${config.wedding.date}T${config.wedding.time}:00`);

    function update() {
      const now = new Date();
      const diff = weddingDate - now;

      if (diff <= 0) {
        document.querySelectorAll('.countdown-number').forEach(el => el.textContent = '0');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const items = document.querySelectorAll('.countdown-item');
      if (items[0]) items[0].querySelector('.countdown-number').textContent = days;
      if (items[1]) items[1].querySelector('.countdown-number').textContent = hours;
      if (items[2]) items[2].querySelector('.countdown-number').textContent = minutes;
      if (items[3]) items[3].querySelector('.countdown-number').textContent = seconds;
    }

    update();
    setInterval(update, 1000);
  }

  function updateEvents() {
    if (!config || !config.events || config.events.length === 0) return;
    const eventsContainer = document.querySelector('[data-events]');
    if (!eventsContainer) return;

    const icons = {
      lamp: `<svg viewBox="0 0 28 28"><path d="M14 2C14 2 10 8 10 12C10 14.2 11.8 16 14 16C16.2 16 18 14.2 18 12C18 8 14 2 14 2Z"/><rect x="12" y="16" width="4" height="4" rx="1"/><rect x="10" y="20" width="8" height="2" rx="1"/><rect x="9" y="22" width="10" height="2" rx="1"/></svg>`,
      mandala: `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="3"/><circle cx="14" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" stroke-width="0.5"/><path d="M14 3 L14 7M14 21 L14 25M3 14 L7 14M21 14 L25 14" stroke="currentColor" stroke-width="0.5"/></svg>`
    };

    eventsContainer.innerHTML = config.events.map(event => `
      <div class="event-card">
        <div class="event-icon">${icons[event.icon] || icons.mandala}</div>
        <h3 class="event-title">${event.title}</h3>
        <p class="event-date">${event.date}</p>
      </div>
    `).join('');
  }

  function updateCalendarButtons() {
    if (!config || !config.wedding.showCalendarButtons) return;
    const container = document.querySelector('[data-calendar-buttons]');
    if (!container) return;

    const startDate = config.wedding.date.replace(/-/g, '');
    const title = encodeURIComponent(config.wedding.calendarTitle);
    const location = encodeURIComponent(config.wedding.calendarLocation);
    const details = encodeURIComponent(`Wedding ceremony of ${config.couple.groomName} & ${config.couple.brideName}`);

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${startDate}&location=${location}&details=${details}`;

    const appleUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${startDate}%0ADTEND:${startDate}%0ASUMMARY:${title}%0ALOCATION:${location}%0ADESCRIPTION:${details}%0AEND:VEVENT%0AEND:VCALENDAR`;

    container.innerHTML = `
      <a href="${googleUrl}" target="_blank" rel="noopener" class="calendar-btn">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Google Calendar
      </a>
      <a href="${appleUrl}" class="calendar-btn">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Apple Calendar
      </a>
    `;
  }

  function updateVenue() {
    if (!config || !config.venue.enabled) return;

    const venueSection = document.querySelector('.venue-section');
    if (!venueSection) return;

    document.querySelectorAll('[data-venue="name"]').forEach(el => {
      el.textContent = config.venue.name;
    });
    document.querySelectorAll('[data-venue="address"]').forEach(el => {
      el.textContent = config.venue.address;
    });

    const mapContainer = document.querySelector('[data-map]');
    if (mapContainer) {
      if (config.venue.showMap) {
        let embedUrl;
        const mapsLink = config.venue.googleMapsLink;

        if (mapsLink.includes('/embed?')) {
          embedUrl = mapsLink;
        } else if (mapsLink.includes('maps.app.goo.gl') || mapsLink.includes('google.com/maps')) {
          const encoded = encodeURIComponent(config.venue.name);
          embedUrl = `https://maps.google.com/maps?q=${encoded}&t=m&z=15&output=embed`;
        } else {
          const encoded = encodeURIComponent(config.venue.name);
          embedUrl = `https://maps.google.com/maps?q=${encoded}&t=m&z=15&output=embed`;
        }

        mapContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen loading="lazy" referrerpolicy="no-referrer"></iframe>`;
        mapContainer.style.display = '';
      } else {
        mapContainer.style.display = 'none';
      }
    }

    const directionsBtn = document.querySelector('[data-directions]');
    if (directionsBtn) {
      directionsBtn.style.display = config.venue.showDirections ? '' : 'none';
      directionsBtn.href = config.venue.googleMapsLink;
    }
  }

  function updateGallery() {
    if (!config || !config.photos.enabled) return;
    const grid = document.querySelector('[data-gallery]');
    if (!grid) return;

    grid.innerHTML = config.photos.gallery.map(img => `
      <img src="${getAssetPath(img)}" alt="Wedding moment" loading="lazy">
    `).join('');
  }

  function updateWhatsApp() {
    if (!config || !config.whatsapp.enabled) return;
    const btn = document.querySelector('[data-whatsapp]');
    if (!btn) return;

    const message = config.whatsapp.messageTemplate
      .replace('{groom}', config.couple.groomName)
      .replace('{bride}', config.couple.brideName);

    btn.href = `https://wa.me/${config.whatsapp.number}?text=${encodeURIComponent(message)}`;
  }

  function setupMusic() {
    if (!config || !config.music.enabled) return;

    const track = config.music.tracks[config.music.defaultTrack];
    if (!track) return;

    const audio = document.createElement('audio');
    audio.loop = true;
    audio.preload = 'auto';
    audio.src = getAssetPath(`/music/${track.file}`);
    document.body.appendChild(audio);

    const btn = document.querySelector('[data-music-btn]');
    if (!btn) return;

    let isPlaying = false;

    const playMusic = () => {
      audio.volume = 0.09;
      audio.play().catch(() => { });
    };

    btn.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        btn.classList.remove('playing');
        btn.innerHTML = `<svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
        </svg>`;
      } else {
        playMusic();
        btn.classList.add('playing');
        btn.innerHTML = `<svg viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>`;
      }

      isPlaying = !isPlaying;
    });

    // document.addEventListener('click', function autoPlay() {
    //   if (!isPlaying) {
    //     audio.play().catch(() => {});
    //     isPlaying = true;
    //     btn.classList.add('playing');
    //     btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    //   }
    //   document.removeEventListener('click', autoPlay);
    // }, { once: true });
  }

  function updateFooter() {
    if (!config) return;
    document.querySelectorAll('[data-footer="names"]').forEach(el => {
      el.textContent = `${config.couple.groomName} & ${config.couple.brideName}`;
    });
    document.querySelectorAll('[data-footer="date"]').forEach(el => {
      el.textContent = config.wedding.displayText;
    });
  }

  function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section').forEach(section => {
      observer.observe(section);
    });
  }

  function toggleSections() {
    if (!config) return;

    const venueSection = document.querySelector('.venue-section');
    if (venueSection && !config.venue.enabled) {
      venueSection.style.display = 'none';
    }

    const calendarContainer = document.querySelector('[data-calendar-buttons]');
    if (calendarContainer && !config.wedding.showCalendarButtons) {
      calendarContainer.style.display = 'none';
    }

    const whatsappSection = document.querySelector('.whatsapp-section');
    if (whatsappSection && !config.whatsapp.enabled) {
      whatsappSection.style.display = 'none';
    }

    const musicBtn = document.querySelector('[data-music-btn]');
    if (musicBtn && !config.music.enabled) {
      musicBtn.style.display = 'none';
    }

    const gallerySection = document.querySelector('.gallery-section');
    if (gallerySection && !config.photos.enabled) {
      gallerySection.style.display = 'none';
    }
  }

  async function init() {
    config = await loadConfig();
    if (!config) {
      document.querySelector('.loading')?.remove();
      return;
    }

    updateNames();
    updateHero();
    updateCountdown();
    updateEvents();
    updateCalendarButtons();
    updateVenue();
    updateGallery();
    updateWhatsApp();
    updateFooter();
    setupMusic();
    toggleSections();
    setupScrollAnimations();

    const loading = document.querySelector('.loading');
    if (loading) loading.style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
