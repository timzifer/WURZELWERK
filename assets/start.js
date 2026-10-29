/* Startseite: Kennung (P30, SI …) oder Pflanzennamen eintippen. */
(function () {
  "use strict";
  var index = JSON.parse(document.getElementById("index").textContent);
  var eingabe = document.getElementById("q");
  var liste = document.getElementById("treffer");

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
  }
  function kennung(s) {
    var k = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (/^P\d$/.test(k)) k = "P0" + k.slice(1);
    if (/^\d{1,2}$/.test(k)) k = "P" + ("0" + k).slice(-2);
    return k;
  }
  function suche(text) {
    var k = kennung(text), n = norm(text).trim();
    if (!n) return [];
    var genau = index.filter(function (e) { return e.k === k; });
    var name = index.filter(function (e) {
      return e.k !== k && (norm(e.n).indexOf(n) >= 0 || norm(e.b).indexOf(n) >= 0);
    });
    name.sort(function (a, b) { return norm(a.n).indexOf(n) - norm(b.n).indexOf(n); });
    return genau.concat(name).slice(0, 12);
  }
  function zeige() {
    var t = suche(eingabe.value);
    liste.innerHTML = "";
    t.forEach(function (e) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = e.k + "/";
      var sp = document.createElement("span");
      sp.className = "kennung";
      sp.textContent = e.k;
      a.appendChild(sp);
      a.appendChild(document.createTextNode(" " + e.n));
      li.appendChild(a);
      liste.appendChild(li);
    });
    if (eingabe.value && !t.length) {
      var li = document.createElement("li");
      li.textContent = "Nichts gefunden – die Kennung steht senkrecht neben dem kleinen Code unten auf der Buchseite.";
      liste.appendChild(li);
    }
    return t;
  }
  eingabe.addEventListener("input", zeige);
  eingabe.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") {
      var t = zeige();
      if (t.length) location.href = t[0].k + "/";
    }
  });
  var q = new URLSearchParams(location.search).get("q");
  if (q) { eingabe.value = q; zeige(); }
})();
