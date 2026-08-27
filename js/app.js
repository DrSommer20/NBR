/* ============================================================
   APP — Router & Start
   ============================================================ */

const App = {
  params: {},
  onLeave: null,
  current: null,

  routes: {
    cockpit: r => Views.cockpit(r),
    map:     r => Views.map(r),
    lexikon: r => Views.lexikon(r),
    learn:   r => Views.learn(r),
    games:   r => Games.hub(r),
    guide:   r => Views.guide(r),
    ac:      r => Views.ac(r),
    profile: r => Views.profile(r)
  },

  go(route, params = {}) {
    if (this.onLeave) { try { this.onLeave(); } catch (e) {} this.onLeave = null; }
    this.params = params;
    this.current = route;

    const root = document.getElementById('view');
    root.classList.remove('fade-in');
    void root.offsetWidth;              // Reflow für Neustart der Animation
    root.classList.add('fade-in');

    if (route.startsWith('game:')) {
      const g = route.slice(5);
      if (Games[g]) Games[g](root); else Games.hub(root);
      this.setNav('games');
    } else {
      (this.routes[route] || this.routes.cockpit)(root);
      this.setNav(route);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    location.hash = route + (params.corner ? ':' + params.corner : '');
    this.bindNavLinks(root);
  },

  /* "map", "lexikon:karussell", "game:quiz" → passende Ansicht */
  routeFromHash(h) {
    if (!h) { this.go('cockpit'); return; }
    if (h.startsWith('game:')) { this.go(h); return; }
    const [r, c] = h.split(':');
    this.go(r || 'cockpit', c ? { corner: c } : {});
  },

  setNav(route) {
    document.querySelectorAll('.nav-item').forEach(b =>
      b.classList.toggle('is-on', b.dataset.route === route));
  },

  /* data-nav="…" überall im Content nutzbar */
  bindNavLinks(root) {
    root.querySelectorAll('[data-nav]').forEach(b => {
      if (b._navBound) return;
      b._navBound = true;
      b.addEventListener('click', () => { Sfx.click(); App.go(b.dataset.nav); });
    });
  },

  init() {
    Store.load();
    ND.applyGeo();          // echte Kurvenpositionen aus geo.js übernehmen
    UI.updateHud();

    document.querySelectorAll('.nav-item').forEach(b =>
      b.addEventListener('click', () => { Sfx.click(); App.go(b.dataset.route); }));

    document.getElementById('nav-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('view').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });

    // Tastatur-Shortcuts: Alt + 1…8 (ohne Alt würden wir Eingaben in Spielen kapern)
    document.addEventListener('keydown', e => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.matches('input, textarea, select')) return;
      const map = { '1':'cockpit','2':'map','3':'lexikon','4':'learn','5':'games','6':'guide','7':'ac','8':'profile' };
      if (map[e.key]) { e.preventDefault(); App.go(map[e.key]); }
    });

    // Direkter Aufruf per URL-Hash (z. B. …/#map oder …/#game:quiz)
    window.addEventListener('hashchange', () => {
      const h = location.hash.replace('#', '');
      const cur = App.current + (App.params.corner ? ':' + App.params.corner : '');
      if (!h || h === cur) return;
      App.routeFromHash(h);
    });

    // Route aus Hash wiederherstellen
    App.routeFromHash(location.hash.replace('#', ''));

    // Erster Besuch: Begrüßung
    if (Store.data.xp === 0 && Object.keys(Store.data.mastery).length === 0) {
      setTimeout(() => UI.toast('Willkommen in der Grünen Hölle 🏁',
        'Tipp: Fang mit dem Kurven-Quiz an. Tasten 1–8 wechseln die Ansicht.'), 800);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
