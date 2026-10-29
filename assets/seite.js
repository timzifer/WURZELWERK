/* Quellenseiten zu „Wurzelwerk“: Quelle ↔ Bereich im Vorschaubild hervorheben.
   Ohne dieses Skript bleibt die Seite eine vollständige, lesbare Quellenliste. */
(function () {
  "use strict";
  var daten = JSON.parse(document.getElementById("daten").textContent);
  var body = document.body;
  var quellen = Array.prototype.slice.call(document.querySelectorAll(".quelle"));
  var knoepfe = Array.prototype.slice.call(document.querySelectorAll(".q"));
  var bereichsKnoepfe = Array.prototype.slice.call(document.querySelectorAll(".b"));
  var bloecke = Array.prototype.slice.call(document.querySelectorAll(".block"));
  var leiste = document.querySelector(".leiste");
  var fest = null; // {art: "q"|"b", id}
  var beruehrt = false;
  var liste = document.querySelector(".liste");

  // Bei gewähltem Bereich stehen nur dessen Quellen in der Liste; diese Zeile sagt es und hebt es auf
  var filter = document.createElement("p");
  filter.className = "filter";
  filter.hidden = true;
  var filterText = document.createElement("span");
  var alle = document.createElement("button");
  alle.type = "button";
  alle.className = "alle-zeigen";
  alle.textContent = "Alle zeigen";
  alle.addEventListener("click", function () { fest = null; zeige(null); });
  filter.appendChild(filterText);
  filter.appendChild(alle);
  if (liste) liste.parentNode.insertBefore(filter, liste);

  function quellenVon(block) { return daten.bloecke[block] || []; }

  function bereichName(id) {
    var k = document.querySelector('.b[data-block="' + id + '"]');
    if (k) return k.firstChild.textContent.trim();
    var t = document.querySelector('.block[data-block="' + id + '"] title');
    return t ? t.textContent.replace(/:.*$/, "") : id;
  }

  function zeige(auswahl) {
    // auswahl: null | {art, id}
    var gefiltert = !!(auswahl && fest && auswahl.art === "b");
    body.classList.toggle("bereich", gefiltert);
    filter.hidden = !gefiltert;
    if (gefiltert) {
      var n = quellenVon(auswahl.id).length;
      filterText.textContent = "Quellen für „" + bereichName(auswahl.id) + "“ (" + n + " von " + quellen.length + ") · ";
    }
    bloecke.forEach(function (g) {
      g.classList.remove("treffer");
      g.setAttribute("aria-pressed", "false");
      g.querySelectorAll(".f").forEach(function (r) { r.classList.remove("an"); });
    });
    quellen.forEach(function (li) { li.classList.remove("treffer"); });
    knoepfe.forEach(function (k) { k.setAttribute("aria-pressed", "false"); });
    bereichsKnoepfe.forEach(function (k) { k.setAttribute("aria-pressed", "false"); });
    if (!auswahl) { body.classList.remove("aktiv"); return []; }
    body.classList.add("aktiv");
    var ids = auswahl.art === "q" ? [auswahl.id] : quellenVon(auswahl.id);
    var treffer = [];
    bloecke.forEach(function (g) {
      var b = g.getAttribute("data-block");
      var passt = auswahl.art === "b" ? b === auswahl.id
        : quellenVon(b).indexOf(auswahl.id) >= 0;
      if (!passt) return;
      g.classList.add("treffer");
      treffer.push(g);
      g.querySelectorAll(".f").forEach(function (r) {
        if (ids.indexOf(r.getAttribute("data-q")) >= 0) r.classList.add("an");
      });
      if (auswahl.art === "b") g.setAttribute("aria-pressed", "true");
    });
    quellen.forEach(function (li) {
      if (ids.indexOf(li.getAttribute("data-quelle")) >= 0) li.classList.add("treffer");
    });
    if (auswahl.art === "q") {
      var k = document.querySelector('.quelle[data-quelle="' + auswahl.id + '"] .q');
      if (k) k.setAttribute("aria-pressed", String(!!fest));
    } else {
      bereichsKnoepfe.forEach(function (k) {
        if (k.getAttribute("data-block") === auswahl.id) k.setAttribute("aria-pressed", String(!!fest));
      });
    }
    return treffer;
  }

  // Trefferseite in der (wischbaren) Leiste sichtbar machen
  function blattZeigen(treffer) {
    if (!leiste || !treffer.length) return;
    var konkret = treffer.filter(function (g) { return !g.classList.contains("allgemein"); });
    var fig = (konkret[0] || treffer[0]).closest(".blatt");
    var l = leiste.getBoundingClientRect(), f = fig.getBoundingClientRect();
    if (f.left < l.left || f.right > l.right) {
      leiste.scrollTo({ left: leiste.scrollLeft + f.left - l.left - (l.width - f.width) / 2, behavior: "smooth" });
    }
  }

  function umschalten(auswahl) {
    if (fest && fest.art === auswahl.art && fest.id === auswahl.id) {
      fest = null;
      zeige(null);
      return;
    }
    fest = auswahl;
    var treffer = zeige(auswahl);
    if (auswahl.art === "q") blattZeigen(treffer);
    else if (!filter.hidden) filter.scrollIntoView({ block: "start", behavior: "smooth" }); // Anfang der gefilterten Liste
  }

  function vorschau(auswahl) { if (!fest && !beruehrt) zeige(auswahl); }
  function zurueck() { if (!beruehrt) zeige(fest); }

  // Touch: kein Hover-Vorgriff, Tippen schaltet
  document.addEventListener("touchstart", function () { beruehrt = true; }, { passive: true, once: true });

  knoepfe.forEach(function (k) {
    var id = k.closest(".quelle").getAttribute("data-quelle");
    k.addEventListener("click", function () { umschalten({ art: "q", id: id }); });
    k.addEventListener("mouseenter", function () { vorschau({ art: "q", id: id }); });
    k.addEventListener("mouseleave", zurueck);
    k.addEventListener("focus", function () { if (!fest) { var t = zeige({ art: "q", id: id }); blattZeigen(t); } });
    k.addEventListener("blur", function () { zeige(fest); });
  });

  bereichsKnoepfe.forEach(function (k) {
    var id = k.getAttribute("data-block");
    k.addEventListener("click", function () {
      umschalten({ art: "b", id: id });
      var g = document.querySelector('.block[data-block="' + id + '"]');
      if (g && fest) blattZeigen([g]);
    });
    k.addEventListener("mouseenter", function () { vorschau({ art: "b", id: id }); });
    k.addEventListener("mouseleave", zurueck);
  });

  bloecke.forEach(function (g) {
    if (g.classList.contains("allgemein")) return;
    var id = g.getAttribute("data-block");
    g.addEventListener("click", function () { umschalten({ art: "b", id: id }); });
    g.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); umschalten({ art: "b", id: id }); }
    });
    g.addEventListener("mouseenter", function () { vorschau({ art: "b", id: id }); });
    g.addEventListener("mouseleave", zurueck);
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && fest) { fest = null; zeige(null); }
    // Blättern mit ← und →, außer beim Tippen oder mit Zusatztasten
    if ((ev.key === "ArrowLeft" || ev.key === "ArrowRight") && !ev.altKey && !ev.ctrlKey && !ev.metaKey &&
        !ev.shiftKey && !/^(INPUT|TEXTAREA|SELECT)$/.test((ev.target.tagName || ""))) {
      var ziel = document.querySelector(ev.key === "ArrowLeft" ? 'a[rel="prev"]' : 'a[rel="next"]');
      if (ziel) location.href = ziel.href;
    }
  });

  // Sprung von der Gesamtliste (#q-B02): Quelle gleich hervorheben
  var m = /^#q-(.+)$/.exec(location.hash);
  if (m && document.querySelector('.quelle[data-quelle="' + decodeURIComponent(m[1]) + '"]')) {
    umschalten({ art: "q", id: decodeURIComponent(m[1]) });
  }
})();
