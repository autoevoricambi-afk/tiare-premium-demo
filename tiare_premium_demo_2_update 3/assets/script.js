(() => {
  const body = document.body;
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });
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
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

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

    if (summaryRate) {
      summaryRate.textContent = price ? `${money(price)} / notte` : 'Da verificare';
    }

    if (summaryEstimate && summaryEstimateNote) {
      if (price && nights) {
        const total = price * nights;
        summaryEstimate.textContent = `Indicativamente da ${money(total)}`;
        summaryEstimateNote.textContent = 'Stima calcolata sulla tariffa camera pubblicata. Disponibilità e conferma finale restano a cura dell’host.';
      } else if (price) {
        summaryEstimate.textContent = `Da ${money(price)} / notte`;
        summaryEstimateNote.textContent = 'Seleziona le date per ottenere una stima di soggiorno. La conferma finale viene inviata dall’host.';
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
    setTimeout(() => notes?.focus(), 550);
  });

  const roomButtons = document.querySelectorAll('.room-select');
  roomButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.room || 'Nessuna preferenza';
      if (room) room.value = selected;
      if (quickRoom) quickRoom.value = selected;
      updateSummary();
      scrollToAvailability();
      setTimeout(() => checkin?.focus(), 550);
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
  const chatChips = document.querySelectorAll('[data-prompt]');

  const openChat = () => {
    body.classList.add('chat-open');
    chatPanel?.setAttribute('aria-hidden', 'false');
    setTimeout(() => chatInput?.focus(), 250);
  };
  const closeChat = () => {
    body.classList.remove('chat-open');
    chatPanel?.setAttribute('aria-hidden', 'true');
  };

  chatLauncher?.addEventListener('click', openChat);
  chatClose?.addEventListener('click', closeChat);

  const appendMessage = (text, type = 'bot', allowHtml = false) => {
    if (!chatMessages) return;
    const el = document.createElement('div');
    el.className = `message ${type}`;
    if (allowHtml) el.innerHTML = text;
    else el.textContent = text;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const normalizeText = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const answerFor = (prompt) => {
    const q = normalizeText(prompt);
    if (q.includes('prezz') || q.includes('tariff') || q.includes('costo')) {
      return 'Le tariffe visibili sono: Doppia Ginestra €70/notte, Doppia Tulipano €70/notte e Tripla Ranuncolo €130/notte. La Suite Lavanda viene gestita con tariffa su richiesta. Per la conferma sulle date, usa il modulo disponibilità.';
    }
    if (q.includes('disponibil') || q.includes('liber') || q.includes('prenot')) {
      return 'Per verificare disponibilità inserisci check-in, check-out, ospiti e camera nel modulo. Il sito prepara il messaggio WhatsApp completo per l’host.';
    }
    if (q.includes('camera') || q.includes('stanze') || q.includes('lavanda') || q.includes('tulipano') || q.includes('ginestra') || q.includes('ranuncolo')) {
      return 'Tiarè presenta Suite Lavanda, Doppia Tulipano, Doppia Ginestra e Tripla Ranuncolo. Ranuncolo è la soluzione più versatile fino a 3 ospiti.';
    }
    if (q.includes('dove') || q.includes('posizione') || q.includes('indirizzo') || q.includes('trani')) {
      return 'Il B&B si trova in Via Simone de Brado n.123, 76125 Trani. È pensato per vivere mare, centro storico e atmosfera della città.';
    }
    if (q.includes('bici') || q.includes('noleggio') || q.includes('auto')) {
      return 'Tra le possibilità indicate dalla struttura figurano, su richiesta, noleggio biciclette e servizio di autonoleggio.';
    }
    if (q.includes('contatto') || q.includes('telefono') || q.includes('whatsapp') || q.includes('email')) {
      return 'Puoi contattare Tiarè al +39 368 435 026, via WhatsApp o via email a bbtriare@gmail.com.';
    }
    if (q.includes('check') || q.includes('arrivo') || q.includes('partenza')) {
      return 'Per orari specifici di arrivo e partenza, invia una richiesta diretta all’host insieme alle date del soggiorno.';
    }
    return 'Posso aiutarti con camere, tariffe, posizione, servizi e disponibilità. Per una richiesta completa, usa il modulo disponibilità oppure scrivimi “prezzi” o “camere”.';
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

  chatChips.forEach((button) => {
    button.addEventListener('click', () => {
      openChat();
      handlePrompt(button.dataset.prompt || button.textContent || '');
    });
  });
})();
