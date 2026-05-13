document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuLinks = mobileMenu?.querySelectorAll('a') || [];

  const openMenu = () => {
    body.classList.add('menu-open');
    mobileMenu?.setAttribute('aria-hidden', 'false');
    menuToggle?.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    body.classList.remove('menu-open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
  };

  menuToggle?.addEventListener('click', () => {
    if (body.classList.contains('menu-open')) closeMenu();
    else openMenu();
  });

  mobileMenuLinks.forEach((link) => link.addEventListener('click', closeMenu));

  const revealItems = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealItems.forEach((item) => observer.observe(item));

  const toISODate = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const fromISO = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const niceDate = (value) => {
    const date = fromISO(value);
    if (!date) return '';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
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
    if (!checkoutEl.value || (fromISO(checkoutEl.value) && fromISO(checkoutEl.value) <= inDate)) {
      checkoutEl.value = toISODate(next);
    }
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
    'Doppia Tulipano': 70,
    'Doppia Ginestra': 70,
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
    const dateText = checkin?.value && checkout?.value
      ? `${niceDate(checkin.value)} → ${niceDate(checkout.value)}`
      : 'Seleziona le date';
    const nights = nightsBetween(checkin?.value || '', checkout?.value || '');
    const price = roomPriceMap[selectedRoom];

    if (summaryDates) summaryDates.textContent = dateText;
    if (summaryNights) summaryNights.textContent = nights ? `${nights} ${nights === 1 ? 'notte' : 'notti'}` : '—';
    if (summaryGuests) summaryGuests.textContent = selectedGuests;
    if (summaryRoomTitle) summaryRoomTitle.textContent = selectedRoom === 'Nessuna preferenza' ? 'Soggiorno a Tiarè' : selectedRoom;
    if (summaryRate) summaryRate.textContent = price ? `${money(price)} / notte` : 'Da verificare';

    if (summaryEstimate && summaryEstimateNote) {
      if (price && nights) {
        summaryEstimate.textContent = `Indicativamente da ${money(price * nights)}`;
        summaryEstimateNote.textContent = 'Stima calcolata sulla tariffa pubblicata. Disponibilità e conferma finale restano a cura dell’host.';
      } else if (price) {
        summaryEstimate.textContent = `Da ${money(price)} / notte`;
        summaryEstimateNote.textContent = 'Seleziona le date per ottenere una stima indicativa del soggiorno.';
      } else {
        summaryEstimate.textContent = 'Tariffa su richiesta';
        summaryEstimateNote.textContent = 'Per questa camera la quotazione viene confermata direttamente dall’host.';
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
    setTimeout(() => notes?.focus(), 500);
  });

  const roomButtons = document.querySelectorAll('.room-select');
  roomButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.room || 'Nessuna preferenza';
      if (room) room.value = selected;
      if (quickRoom) quickRoom.value = selected;
      updateSummary();
      scrollToAvailability();
      setTimeout(() => checkin?.focus(), 500);
    });
  });

  const buildWhatsAppPayload = () => {
    const selectedRoom = room?.value || 'Nessuna preferenza';
    const selectedGuests = guests?.value || '2 ospiti';
    const nights = nightsBetween(checkin?.value || '', checkout?.value || '');
    const price = roomPriceMap[selectedRoom];
    const estimate = price && nights ? `${money(price * nights)} indicativi sulla tariffa pubblicata` : (price ? `${money(price)} / notte` : 'da verificare');

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
  const chipButtons = document.querySelectorAll('[data-prompt]');

  const openChat = () => {
    body.classList.add('chat-open');
    chatPanel?.setAttribute('aria-hidden', 'false');
    setTimeout(() => chatInput?.focus(), 200);
  };
  const closeChat = () => {
    body.classList.remove('chat-open');
    chatPanel?.setAttribute('aria-hidden', 'true');
  };

  chatLauncher?.addEventListener('click', openChat);
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
    if (q.includes('prezz') || q.includes('tariff') || q.includes('cost')) {
      return 'Le tariffe pubblicate sono: Doppia Tulipano €70/notte, Doppia Ginestra €70/notte e Tripla Ranuncolo €130/notte. La Suite Lavanda viene quotata su richiesta.';
    }
    if (q.includes('disponibil') || q.includes('prenot') || q.includes('liber')) {
      return 'Per verificare disponibilità usa il modulo con date, ospiti e camera preferita. Il sito prepara il messaggio WhatsApp completo per l’host.';
    }
    if (q.includes('camera') || q.includes('stanza') || q.includes('lavanda') || q.includes('tulipano') || q.includes('ginestra') || q.includes('ranuncolo')) {
      return 'Tiarè propone Suite Lavanda, Doppia Tulipano, Doppia Ginestra e Tripla Ranuncolo. Ranuncolo è la soluzione più versatile fino a 3 ospiti.';
    }
    if (q.includes('trani') || q.includes('cattedrale') || q.includes('porto') || q.includes('storia')) {
      return 'Trani è valorizzata come parte dell’esperienza: la Cattedrale sul mare, il porto, il centro storico e l’atmosfera pugliese elegante sono elementi chiave del soggiorno.';
    }
    if (q.includes('dove') || q.includes('indirizzo') || q.includes('posizione')) {
      return 'Il B&B si trova in Via Simone de Brado n.123, 76125 Trani. Per spostamenti e consigli, l’host può aiutarti direttamente.';
    }
    return 'Posso aiutarti su camere, tariffe, disponibilità, posizione e consigli su Trani. Se vuoi, puoi anche usare il modulo disponibilità per inviare subito una richiesta completa su WhatsApp.';
  };

  const handlePrompt = (text) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    appendMessage(cleaned, 'user');
    window.setTimeout(() => appendMessage(answerFor(cleaned), 'bot'), 240);
  };

  chipButtons.forEach((button) => {
    button.addEventListener('click', () => {
      openChat();
      handlePrompt(button.dataset.prompt || button.textContent || '');
    });
  });

  chatForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = chatInput?.value || '';
    if (!value.trim()) return;
    handlePrompt(value);
    chatInput.value = '';
  });
});
