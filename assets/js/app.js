/* Lightbox pro koordinační výkresy.
   Bez JS zůstává odkaz funkční — výkres se otevře v nové záložce. */
(function () {
  var box = null;

  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
      '<button type="button" class="lb-close" aria-label="Zavřít">&#215;</button>' +
      '<img alt=""><p></p>';
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('lb-close')) close();
    });
    document.body.appendChild(box);
  }

  function open(src, caption) {
    if (!box) build();
    box.querySelector('img').src = src;
    box.querySelector('p').textContent = caption || '';
    box.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    box.querySelector('.lb-close').focus();
  }

  function close() {
    if (!box) return;
    box.classList.remove('is-open');
    document.documentElement.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.plan-img') : null;
    if (!a) return;
    e.preventDefault();
    var img = a.querySelector('img');
    var fig = a.closest('figure');
    var cap = fig ? fig.querySelector('figcaption') : null;
    open(img.currentSrc || img.src, cap ? cap.textContent : '');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

/* Přepínač motivu. Výchozí je světlý; volba se pamatuje v localStorage.
   Nastavení motivu při načtení řeší inline skript v <head>, aby stránka
   neproblikla světlou verzí. */
(function () {
  var btn = document.querySelector('.theme-btn');
  if (!btn) return;
  var meta = document.querySelector('meta[name="theme-color"]');

  function uloz(motiv) {
    try { localStorage.setItem('eps-theme', motiv); } catch (e) {}
  }

  btn.addEventListener('click', function () {
    var tmavy = document.documentElement.getAttribute('data-theme') === 'dark';
    if (tmavy) {
      document.documentElement.removeAttribute('data-theme');
      uloz('light');
      if (meta) meta.setAttribute('content', '#f7f8fa');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      uloz('dark');
      if (meta) meta.setAttribute('content', '#0a0a0a');
    }
  });
})();

/* Navigace. Odkazy jsou v <details>, protože na mobilu se sbalí do rozbalovačky.
   Zavřený <details> ale svůj obsah nevykreslí ani s display:flex — na širokém
   displeji tedy musí zůstat otevřený, jinak odkazy zmizí úplně. */
(function () {
  var wrap = document.querySelector('.nav-wrap');
  if (!wrap) return;
  var uzke = window.matchMedia('(max-width: 940px)');

  function sync() {
    wrap.open = !uzke.matches;
  }
  sync();
  uzke.addEventListener ? uzke.addEventListener('change', sync)
                        : uzke.addListener(sync);

  // na mobilu zavřít po kliknutí do menu i mimo něj
  wrap.addEventListener('click', function (e) {
    if (uzke.matches && e.target.closest('nav a')) wrap.open = false;
  });
  document.addEventListener('click', function (e) {
    if (uzke.matches && wrap.open && !wrap.contains(e.target)) wrap.open = false;
  });
})();

/* Mapa — pin, kraj a řádek legendy se zvýrazňují společně. */
(function () {
  function highlight(kraj, on) {
    [document.getElementById('kraj-' + kraj),
     document.querySelector('.map-legend li[data-kraj="' + kraj + '"]')]
      .forEach(function (el) { if (el) el.classList.toggle('is-hot', on); });
  }

  function wire(el, kraj) {
    ['mouseenter', 'focusin'].forEach(function (t) {
      el.addEventListener(t, function () { highlight(kraj, true); });
    });
    ['mouseleave', 'focusout'].forEach(function (t) {
      el.addEventListener(t, function () { highlight(kraj, false); });
    });
  }

  document.querySelectorAll('.map-pin[data-kraj]').forEach(function (pin) {
    wire(pin, pin.getAttribute('data-kraj'));
  });
  document.querySelectorAll('.map-legend li[data-kraj]').forEach(function (li) {
    wire(li, li.getAttribute('data-kraj'));
  });
})();

/* Scroll-reveal. Bez JS zůstává vše viditelné; animace se zapínají třídou
   js-anim až tady, aby stránka nikdy nezůstala schovaná. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-anim');

  var cile = document.querySelectorAll(
    '.section-head, .usp, .specs, .timeline, .plan, .panel, .usp-note, .deliv, ' +
    '.map-wrap, .up-grid, .stats, .cards .card, .doc-links .doc');
  var BEZ_REVEAL = ['usp', 'specs', 'timeline', 'deliv'];
  cile.forEach(function (el) {
    if (!BEZ_REVEAL.some(function (t) { return el.classList.contains(t); })) {
      el.classList.add('reveal');
    }
    // index pro stagger dětí
    var deti = el.querySelectorAll('.usp-item, li');
    deti.forEach(function (d, i) { d.style.setProperty('--i', Math.min(i, 10)); });
  });

  // Ready bar startuje z nuly a dokreslí se až po odhalení karty.
  document.querySelectorAll('.ready-track span').forEach(function (bar) {
    bar.dataset.cil = bar.style.width;
    bar.style.width = '0%';
  });

  // Počítadlo: velká čísla naskočí od nuly. Animují se jen čistě číselné
  // hodnoty (i s desetinnou čárkou a mezerami) — termíny a texty ne.
  function pocitadlo(el) {
    var uzel = el.firstChild;
    if (!uzel || uzel.nodeType !== 3) return;
    var puvodni = uzel.textContent;
    if (!/^[\d\s ]+(,\d+)?$/.test(puvodni.trim())) return;
    var des = (puvodni.split(',')[1] || '').length;
    var cil = parseFloat(puvodni.replace(/[\s ]/g, '').replace(',', '.'));
    if (!isFinite(cil) || cil === 0) return;
    var start = null, DOBA = 950;
    function fmt(v) {
      var s = v.toFixed(des).replace('.', ',');
      var celek = s.split(',')[0];
      celek = celek.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return des ? celek + ',' + s.split(',')[1] : celek;
    }
    function krok(t) {
      if (!start) start = t;
      var podil = Math.min((t - start) / DOBA, 1);
      var ease = 1 - Math.pow(1 - podil, 3);
      uzel.textContent = fmt(cil * ease);
      if (podil < 1) requestAnimationFrame(krok);
      else uzel.textContent = puvodni;
    }
    requestAnimationFrame(krok);
  }

  function aktivuj(el) {
    el.classList.add('is-in');
    if (el.classList.contains('stats')) {
      el.querySelectorAll('dd').forEach(pocitadlo);
    }
    el.querySelectorAll('.ready-track span').forEach(function (bar) {
      bar.style.width = bar.dataset.cil || bar.style.width;
    });
  }

  var io = new IntersectionObserver(function (zaznamy) {
    zaznamy.forEach(function (z) {
      if (z.isIntersecting) {
        aktivuj(z.target);
        io.unobserve(z.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  cile.forEach(function (el) { io.observe(el); });

  // Pojistka: v tabu otevřeném na pozadí IntersectionObserver nevyhodnocuje.
  // Vše, co je při (znovu)zviditelnění ve viewportu, se odkryje ručně.
  function odkryjViditelne() {
    cile.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        aktivuj(el);
        io.unobserve(el);
      }
    });
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) odkryjViditelne();
  });
  setTimeout(odkryjViditelne, 900);
})();
