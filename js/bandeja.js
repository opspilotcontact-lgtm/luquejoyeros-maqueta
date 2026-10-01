/* «Mi bandeja»: las piezas que quieres ver en la mesa. Se guardan en este navegador y se mandan por WhatsApp. */
(function () {
  var CLAVE = 'luque-bandeja', WA = '34683153816';
  var raiz = document.documentElement.getAttribute('data-raiz') || '';
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { return []; } }
  function guardar(l) { try { localStorage.setItem(CLAVE, JSON.stringify(l)); } catch (e) {} }
  var lista = leer();

  var cajon = document.getElementById('cajon');
  var ol = cajon && cajon.querySelector('ol');
  var enviar = cajon && cajon.querySelector('[data-enviar]');

  function esta(slug) { return lista.some(function (p) { return p.slug === slug; }); }
  function pintar() {
    document.querySelectorAll('.bandeja-btn .n').forEach(function (n) { n.textContent = lista.length ? lista.length : ''; });
    document.querySelectorAll('[data-poner]').forEach(function (b) {
      var d = JSON.parse(b.getAttribute('data-poner'));
      var dentro = esta(d.slug);
      b.setAttribute('aria-pressed', dentro ? 'true' : 'false');
      var t = b.querySelector('.t') || b;
      t.textContent = dentro ? (b.dataset.si || 'En tu bandeja') : (b.dataset.no || 'Añadir a la bandeja');
    });
    if (!ol) return;
    ol.innerHTML = '';
    if (!lista.length) {
      ol.innerHTML = '<li class="vacia" style="display:block;border:0">Aún no has elegido ninguna pieza. Añade las que quieras ver y te las tenemos preparadas en la mesa.</li>';
    }
    lista.forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="m chaflan"><img alt="" src="' + raiz + 'img/p/min/' + p.slug + '.webp"></span>' +
        '<span><b></b><small></small></span><button type="button">Quitar</button>';
      li.querySelector('b').textContent = p.nombre;
      li.querySelector('small').textContent = p.ref ? 'Ref. ' + p.ref : '';
      li.querySelector('button').addEventListener('click', function () { quitar(p.slug); });
      ol.appendChild(li);
    });
    if (enviar) {
      var txt = 'Hola, me gustaría reservar mesa en Luque Joyeros para ver estas piezas:\n' +
        lista.map(function (p) { return '· ' + p.nombre + (p.ref ? ' (Ref. ' + p.ref + ')' : ''); }).join('\n') +
        '\n\n¿Qué día y hora os viene bien?';
      enviar.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt);
      enviar.toggleAttribute('hidden', !lista.length);
    }
  }
  function poner(d) { if (!esta(d.slug)) { lista.push(d); guardar(lista); } pintar(); }
  function quitar(slug) { lista = lista.filter(function (p) { return p.slug !== slug; }); guardar(lista); pintar(); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-poner]');
    if (b) {
      var d = JSON.parse(b.getAttribute('data-poner'));
      if (esta(d.slug)) quitar(d.slug); else poner(d);
      return;
    }
    if (e.target.closest('.bandeja-btn') && cajon) { cajon.showModal(); return; }
    if (e.target.closest('[data-cerrar]') && cajon) { cajon.close(); return; }
    if (e.target === cajon) cajon.close();
  });
  window.addEventListener('storage', function (e) { if (e.key === CLAVE) { lista = leer(); pintar(); } });
  pintar();

  /* filtros del catálogo: sin JS se ve todo */
  var rej = document.querySelector('[data-rejilla]');
  if (rej) {
    var estado = { cat: 'todas', metal: 'todos' };
    var params = new URLSearchParams(location.search);
    if (params.get('cat')) estado.cat = params.get('cat');
    var fichas = rej.querySelectorAll('.ficha-min');
    var cuenta = document.querySelector('[data-cuenta]');
    function filtrar() {
      var n = 0;
      fichas.forEach(function (f) {
        var ok = (estado.cat === 'todas' || f.dataset.cat.split(' ').indexOf(estado.cat) > -1) &&
                 (estado.metal === 'todos' || f.dataset.metal.split(' ').indexOf(estado.metal) > -1);
        f.hidden = !ok; if (ok) n++;
      });
      document.querySelectorAll('[data-filtro]').forEach(function (b) {
        var k = b.dataset.filtro, v = b.dataset.valor;
        b.setAttribute('aria-pressed', estado[k] === v ? 'true' : 'false');
      });
      if (cuenta) cuenta.textContent = n + (n === 1 ? ' pieza' : ' piezas');
    }
    document.querySelectorAll('[data-filtro]').forEach(function (b) {
      b.addEventListener('click', function () {
        estado[b.dataset.filtro] = b.dataset.valor;
        var u = new URL(location.href);
        if (estado.cat === 'todas') u.searchParams.delete('cat'); else u.searchParams.set('cat', estado.cat);
        history.replaceState(null, '', u);
        filtrar();
      });
    });
    filtrar();
  }

  /* el reloj oficial de Rolex: cuando la página ya está quieta */
  var rx = document.querySelector('iframe.reloj-rolex[data-src]');
  if (rx) {
    var cargar = function () { rx.src = rx.dataset.src; };
    addEventListener('load', function () { ('requestIdleCallback' in window) ? requestIdleCallback(cargar, { timeout: 3000 }) : setTimeout(cargar, 1500); });
  }

  /* la lupa de joyero: la pieza a unos 2,5 aumentos, como en la mesa */
  var marco = document.querySelector('.producto .principal');
  if (marco) {
    var lupa = marco.querySelector('.lupa'), vidrio = lupa.querySelector('i') || lupa, foto = marco.querySelector('img'), ZOOM = 2.5;
    var mover = function (ev) {
      var r = marco.getBoundingClientRect();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { marco.classList.remove('mirando'); return; }
      var lw = lupa.offsetWidth;
      lupa.style.left = x + 'px'; lupa.style.top = y + 'px';
      vidrio.style.backgroundImage = 'url("' + foto.currentSrc + '")';
      vidrio.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
      var vw = vidrio.offsetWidth; vidrio.style.backgroundPosition = (-(x * ZOOM - vw / 2)) + 'px ' + (-(y * ZOOM - vw / 2)) + 'px';
      marco.classList.add('mirando');
    };
    marco.addEventListener('pointermove', mover);
    marco.addEventListener('pointerdown', mover);
    marco.addEventListener('pointerleave', function () { marco.classList.remove('mirando'); });
    marco.addEventListener('pointerup', function (ev) { if (ev.pointerType !== 'mouse') marco.classList.remove('mirando'); });
    var ayuda = marco.querySelector('.ayuda');
    if (ayuda && matchMedia('(hover: none)').matches) ayuda.textContent = 'Toca y desliza para verla con la lupa';
  }

  /* fotos de la ficha */
  document.querySelectorAll('.mas-fotos button').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = document.querySelector('.principal img');
      p.src = b.dataset.src; p.alt = b.querySelector('img').alt;
    });
  });
})();
