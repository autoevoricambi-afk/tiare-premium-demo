(() => {
  const body = document.body;
  const progress = document.getElementById('page-progress');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  const updateProgress = () => {
    if (!progress) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
    progress.style.width = `${pct}%`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });
    mobileLinks.forEach((link) => link.addEventListener('click', () => {
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }));
  }

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('in-view'));
  }

  const pad = (n) => String(n).padStart(2, '0');
  const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const fromISO = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const niceDate = (value) => {
    const date = fromISO(value);
    return date ? date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  };
  const nightsBetween = (start, end) => {
    const inDate = fromISO(start);
    const outDate = fromISO(end);
    if (!inDate || !outDate || outDate <= inDate) return 0;
    return Math.round((outDate - inDate) / 86400000);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const setDatePair = (checkinEl, checkoutEl) => {
    if (!checkinEl || !checkoutEl) return;
    checkinEl.min = toISODate(today);
    if (!checkinEl.value) checkinEl.value = toISODate(tomorrow);
    const inDate = fromISO(checkinEl.value) || tomorrow;
    const next = new Date(inDate);
    next.setDate(next.getDate() + 1);
    checkoutEl.min = toISODate(next);
    const out = fromISO(checkoutEl.value);
    if (!checkoutEl.value || !out || out <= inDate) checkoutEl.value = toISODate(next);
  };

  const normalizeCheckout = (checkinEl, checkoutEl) => {
    if (!checkinEl || !checkoutEl) return;
    const inDate = fromISO(checkinEl.value);
    if (!inDate) return;
    const next = new Date(inDate);
    next.setDate(next.getDate() + 1);
    checkoutEl.min = toISODate(next);
    const outDate = fromISO(checkoutEl.value);
    if (!outDate || outDate <= inDate) checkoutEl.value = toISODate(next);
  };

  const quickCheckin = document.getElementById('quick-checkin');
  const quickCheckout = document.getElementById('quick-checkout');
  const quickRoom = document.getElementById('quick-room');
  const heroBookingForm = document.getElementById('hero-booking-form');

  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');
  const guests = document.getElementById('guests');
  const room = document.getElementById('room');
  const notes = document.getElementById('notes');
  const availabilityForm = document.getElementById('availability-form');

  setDatePair(quickCheckin, quickCheckout);
  setDatePair(checkin, checkout);

  quickCheckin?.addEventListener('change', () => normalizeCheckout(quickCheckin, quickCheckout));
  checkin?.addEventListener('change', () => {
    normalizeCheckout(checkin, checkout);
    updateSummary();
  });
  checkout?.addEventListener('change', updateSummary);

  const summaryDates = document.getElementById('summary-dates');
  const summaryNights = document.getElementById('summary-nights');
  const summaryGuests = document.getElementById('summary-guests');
  const summaryRate = document.getElementById('summary-rate');
  const summaryEstimate = document.getElementById('summary-estimate');
  const summaryEstimateNote = document.getElementById('summary-estimate-note');
  const summaryRoomTitle = document.getElementById('summary-room-title');

  const roomPriceMap = {
    'Doppia Ginestra': 70,
    'Doppia Tulipano': 100,
    'Tripla Ranuncolo': 130
  };

  const money = (value) => new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);

  function updateSummary() {
    const selectedRoom = room?.value || 'Nessuna preferenza';
    const selectedGuests = guests?.value || '2 ospiti';
    const dateText = checkin?.value && checkout?.value ? `${niceDate(checkin.value)} → ${niceDate(checkout.value)}` : 'Seleziona le date';
    const nights = nightsBetween(checkin?.value || '', checkout?.value || '');
    const price = roomPriceMap[selectedRoom];

    if (summaryDates) summaryDates.textContent = dateText;
    if (summaryNights) summaryNights.textContent = nights ? `${nights} ${nights === 1 ? 'notte' : 'notti'}` : '—';
    if (summaryGuests) summaryGuests.textContent = selectedGuests;
    if (summaryRoomTitle) summaryRoomTitle.textContent = selectedRoom === 'Nessuna preferenza' ? 'Soggiorno a Tiarè' : selectedRoom;
    if (summaryRate) summaryRate.textContent = price ? `${money(price)} / notte` : 'Da verificare';

    if (summaryEstimate && summaryEstimateNote) {
      if (price && nights) {
        summaryEstimate.textContent = `Indicativamente ${money(price * nights)}`;
        summaryEstimateNote.textContent = 'Stima calcolata sulla tariffa pubblicata. La conferma finale dipende da disponibilità e periodo.';
      } else if (price) {
        summaryEstimate.textContent = `Da ${money(price)} / notte`;
        summaryEstimateNote.textContent = 'Seleziona le date per ottenere una stima del soggiorno.';
      } else {
        summaryEstimate.textContent = 'Richiedi disponibilità';
        summaryEstimateNote.textContent = 'Per questa scelta la tariffa viene confermata direttamente dall’host.';
      }
    }
  }

  [guests, room].forEach((element) => element?.addEventListener('change', updateSummary));
  updateSummary();

  const scrollToAvailability = () => document.getElementById('disponibilita')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  heroBookingForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (checkin && quickCheckin) checkin.value = quickCheckin.value;
    if (checkout && quickCheckout) checkout.value = quickCheckout.value;
    if (room && quickRoom) room.value = quickRoom.value;
    updateSummary();
    scrollToAvailability();
    setTimeout(() => notes?.focus(), 520);
  });

  document.querySelectorAll('.room-select').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.room || 'Nessuna preferenza';
      if (room) room.value = selected;
      if (quickRoom) quickRoom.value = selected;
      updateSummary();
      scrollToAvailability();
      setTimeout(() => checkin?.focus(), 520);
    });
  });

  const buildWhatsAppPayload = () => {
    const selectedRoom = room?.value || 'Nessuna preferenza';
    const selectedGuests = guests?.value || '2 ospiti';
    const nights = nightsBetween(checkin?.value || '', checkout?.value || '');
    const price = roomPriceMap[selectedRoom];
    const estimate = price && nights ? `${money(price * nights)} indicativi sulla tariffa pubblicata` : 'da verificare';
    return [
      'Buongiorno, vorrei verificare disponibilità e tariffa per il B&B Tiarè.',
      '',
      `Check-in: ${niceDate(checkin?.value || '') || 'da definire'}`,
      `Check-out: ${niceDate(checkout?.value || '') || 'da definire'}`,
      `Durata: ${nights ? `${nights} ${nights === 1 ? 'notte' : 'notti'}` : 'da definire'}`,
      `Ospiti: ${selectedGuests}`,
      `Camera preferita: ${selectedRoom}`,
      `Indicazione tariffaria: ${estimate}`,
      notes?.value.trim() ? `Richiesta: ${notes.value.trim()}` : ''
    ].filter(Boolean).join('\n');
  };

  availabilityForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const whatsappUrl = `https://wa.me/39368435026?text=${encodeURIComponent(buildWhatsAppPayload())}`;
    window.open(whatsappUrl, '_blank', 'noopener');
  });

  const chatLauncher = document.getElementById('chat-launcher');
  const chatPanel = document.getElementById('chat-panel');
  const chatClose = document.getElementById('chat-close');
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const openInline = document.getElementById('open-concierge-inline');
  const chatChips = document.querySelectorAll('[data-prompt]');

  const openChat = () => {
    body.classList.add('chat-open');
    chatPanel?.setAttribute('aria-hidden', 'false');
    setTimeout(() => chatInput?.focus(), 220);
  };
  const closeChat = () => {
    body.classList.remove('chat-open');
    chatPanel?.setAttribute('aria-hidden', 'true');
  };

  chatLauncher?.addEventListener('click', openChat);
  openInline?.addEventListener('click', openChat);
  chatClose?.addEventListener('click', closeChat);

  const appendMessage = (text, type = 'bot') => {
    if (!chatMessages) return;
    const el = document.createElement('div');
    el.className = `message ${type}`;
    el.textContent = text;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const normalizeText = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const answerFor = (prompt) => {
    const q = normalizeText(prompt);
    if (q.includes('prezz') || q.includes('tariff') || q.includes('costo')) {
      return 'Le tariffe pubblicate sono: Doppia Ginestra €70/notte, Doppia Tulipano €100/notte e Tripla Ranuncolo €130/notte. La Suite Lavanda viene gestita con tariffa su richiesta. Per una conferma sulle date, usa il modulo disponibilità.';
    }
    if (q.includes('disponibil') || q.includes('liber') || q.includes('prenot')) {
      return 'Per verificare disponibilità inserisci check-in, check-out, ospiti e camera nel modulo. Il sito prepara un messaggio WhatsApp completo da inviare all’host.';
    }
    if (q.includes('camera') || q.includes('stanze') || q.includes('lavanda') || q.includes('tulipano') || q.includes('ginestra') || q.includes('ranuncolo')) {
      return 'Puoi richiedere Suite Lavanda, Doppia Ginestra, Doppia Tulipano o Tripla Ranuncolo. Ranuncolo è la soluzione più versatile fino a tre ospiti.';
    }
    if (q.includes('dove') || q.includes('posizione') || q.includes('indirizzo') || q.includes('trani')) {
      return 'Il B&B si trova in Via Simone de Brado n.123, 76125 Trani. La struttura è pensata per vivere mare, centro storico e atmosfera della città.';
    }
    if (q.includes('bici') || q.includes('noleggio') || q.includes('auto')) {
      return 'La struttura indica, su richiesta, noleggio biciclette e servizio di autonoleggio.';
    }
    if (q.includes('mang') || q.includes('ristor') || q.includes('cucina') || q.includes('locale')) {
      return 'Tiarè valorizza anche l’esperienza gastronomica: l’host può consigliare ristoranti tipici, trattorie e locali sul mare.';
    }
    if (q.includes('contatto') || q.includes('telefono') || q.includes('whatsapp') || q.includes('email')) {
      return 'Puoi contattare Tiarè al +39 368 435 026, su WhatsApp o via email a bbtriare@gmail.com.';
    }
    return 'Posso aiutarti con camere, tariffe, disponibilità, posizione, servizi e contatti. Per una richiesta reale, il modo più veloce è il modulo disponibilità.';
  };

  const handlePrompt = (prompt) => {
    const clean = prompt.trim();
    if (!clean) return;
    appendMessage(clean, 'user');
    setTimeout(() => appendMessage(answerFor(clean), 'bot'), 180);
  };

  chatForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = chatInput?.value || '';
    handlePrompt(value);
    if (chatInput) chatInput.value = '';
  });
  chatChips.forEach((button) => button.addEventListener('click', () => {
    openChat();
    handlePrompt(button.dataset.prompt || button.textContent || '');
  }));
})();
