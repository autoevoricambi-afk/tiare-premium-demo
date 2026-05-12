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

  const checkin = document.getElementById('checkin');
  const checkout = document.getElementById('checkout');
  const guests = document.getElementById('guests');
  const room = document.getElementById('room');
  const notes = document.getElementById('notes');
  const summaryDates = document.getElementById('summary-dates');
  const summaryGuests = document.getElementById('summary-guests');
  const summaryRoom = document.getElementById('summary-room');
  const summaryTitle = document.getElementById('summary-title');
  const availabilityForm = document.getElementById('availability-form');
  const roomButtons = document.querySelectorAll('.room-select');

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
  const normalizeCheckout = () => {
    const inDate = fromISO(checkin.value);
    if (!inDate) return;
    const next = new Date(inDate);
    next.setDate(next.getDate() + 1);
    checkout.min = toISODate(next);
    const outDate = fromISO(checkout.value);
    if (!outDate || outDate <= inDate) {
      checkout.value = toISODate(next);
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);
  if (checkin) {
    checkin.min = toISODate(today);
    if (!checkin.value) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      checkin.value = toISODate(tomorrow);
    }
  }
  if (checkin && checkout) {
    normalizeCheckout();
    if (!checkout.value) {
      const dayAfter = fromISO(checkin.value);
      dayAfter.setDate(dayAfter.getDate() + 1);
      checkout.value = toISODate(dayAfter);
    }
  }

  const updateSummary = () => {
    const inValue = checkin?.value || '';
    const outValue = checkout?.value || '';
    const dateText = inValue && outValue ? `${niceDate(inValue)} → ${niceDate(outValue)}` : 'Seleziona le date';
    if (summaryDates) summaryDates.textContent = dateText;
    if (summaryGuests) summaryGuests.textContent = guests?.value || '2 ospiti';
    if (summaryRoom) summaryRoom.textContent = room?.value || 'Nessuna preferenza';

    const roomValue = room?.value || 'Soggiorno';
    if (summaryTitle) {
      summaryTitle.textContent = roomValue === 'Nessuna preferenza' ? 'Soggiorno a Tiarè' : roomValue;
    }
  };

  [checkin, checkout, guests, room].forEach((element) => {
    if (!element) return;
    element.addEventListener('change', () => {
      if (element === checkin) normalizeCheckout();
      updateSummary();
    });
  });
  updateSummary();

  roomButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (room) {
        room.value = button.dataset.room || 'Nessuna preferenza';
        updateSummary();
      }
      const section = document.getElementById('disponibilita');
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => checkin?.focus(), 550);
    });
  });

  if (availabilityForm) {
    availabilityForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const payload = [
        'Buongiorno, vorrei verificare disponibilità e tariffa del B&B Tiarè.',
        '',
        `Check-in: ${niceDate(checkin.value) || 'da definire'}`,
        `Check-out: ${niceDate(checkout.value) || 'da definire'}`,
        `Ospiti: ${guests.value}`,
        `Camera preferita: ${room.value}`,
        notes.value.trim() ? `Richiesta: ${notes.value.trim()}` : ''
      ].filter(Boolean).join('\n');

      const whatsappUrl = `https://wa.me/39368435026?text=${encodeURIComponent(payload)}`;
      window.open(whatsappUrl, '_blank', 'noopener');
    });
  }

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
    if (allowHtml) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const normalizeText = (text) => text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const answerFor = (prompt) => {
    const q = normalizeText(prompt);
    if (q.includes('disponibil') || q.includes('liber') || q.includes('prenot')) {
      return 'Per verificare disponibilità, inserisci check-in, check-out e numero ospiti nel modulo. Il sito prepara subito il messaggio WhatsApp completo per l’host.';
    }
    if (q.includes('prezz') || q.includes('tariff') || q.includes('costo')) {
      return 'La tariffa viene confermata in base a date, durata, camera e numero ospiti. Usa il modulo disponibilità per inviare una richiesta precisa e ricevere il prezzo corretto.';
    }
    if (q.includes('camera') || q.includes('stanze') || q.includes('lavanda') || q.includes('tulipano') || q.includes('ginestra') || q.includes('ranuncolo')) {
      return 'Puoi richiedere Lavanda, Tulipano, Ginestra o Ranuncolo. Ranuncolo è la soluzione più versatile, indicata fino a 3 persone. Se preferisci, seleziona “nessuna preferenza” e lascia scegliere alla struttura.';
    }
    if (q.includes('dove') || q.includes('posizione') || q.includes('indirizzo') || q.includes('trani')) {
      return 'Tiarè si trova in Via Simone de Brado n.123, 76125 Trani. Il soggiorno viene raccontato anche attraverso il centro, il mare e l’atmosfera della città.';
    }
    if (q.includes('bici') || q.includes('auto') || q.includes('noleggio')) {
      return 'Tra le possibilità indicate dalla struttura figurano, su richiesta, noleggio biciclette e servizio di autonoleggio.';
    }
    if (q.includes('ristor') || q.includes('mangiare') || q.includes('cucina')) {
      return 'L’host può consigliare ristoranti, trattorie e locali tipici in base al tipo di esperienza desiderata.';
    }
    if (q.includes('telefono') || q.includes('whatsapp') || q.includes('contatt')) {
      return 'Puoi contattare Riccardo al +39 368 435 026 oppure usare il pulsante WhatsApp presente nel sito.';
    }
    return 'Posso aiutarti con camere, disponibilità, prezzi, posizione e richieste sul soggiorno. Per esigenze specifiche, il canale diretto più rapido resta WhatsApp.';
  };

  const processChatPrompt = (prompt) => {
    const clean = prompt.trim();
    if (!clean) return;
    appendMessage(clean, 'user');
    setTimeout(() => {
      appendMessage(answerFor(clean), 'bot');
    }, 320);
  };

  chatForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = chatInput?.value || '';
    processChatPrompt(value);
    if (chatInput) chatInput.value = '';
  });

  chatChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      openChat();
      processChatPrompt(chip.dataset.prompt || '');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeChat();
      if (body.classList.contains('menu-open')) {
        body.classList.remove('menu-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        mobileMenu?.setAttribute('aria-hidden', 'true');
      }
    }
  });
})();