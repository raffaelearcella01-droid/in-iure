/* ============================================================
   In Iure — strato nativo (solo app Android/iOS via Capacitor)
   Viene inserito da scripts/copy-web.js prima di app.js.
   Sostituisce le funzioni web che dentro la WebView non funzionano:
   download di file (blob), stampa/PDF, Web Share API con file.
   Sul sito web questo file non e' presente e app.js si comporta come prima.
   ============================================================ */
(function () {
  "use strict";
  var Cap = window.Capacitor;
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  if (!isNative) { window.InIureNative = { isNative: false }; return; }

  var P = Cap.Plugins || {};
  var Filesystem = P.Filesystem, Share = P.Share, App = P.App, StatusBar = P.StatusBar;

  document.documentElement.classList.add("is-native-app");

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1] || ""); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  // Scrive il file nella cache dell'app e apre il menu di condivisione di sistema
  // (da cui l'utente puo' salvarlo in File/Drive, aprirlo con Word, inviarlo su WhatsApp...).
  function saveAndShare(blob, filename, title, text) {
    if (!Filesystem || !Share) return Promise.reject(new Error("Plugin nativi non disponibili"));
    return blobToBase64(blob).then(function (data) {
      return Filesystem.writeFile({ path: filename, data: data, directory: "CACHE" });
    }).then(function (res) {
      var opts = { title: title || filename, files: [res.uri], dialogTitle: title || "Condividi" };
      if (text) opts.text = text;
      return Share.share(opts).catch(function (e) {
        // L'utente che chiude il menu di condivisione non e' un errore
        if (/cancel/i.test(String(e && (e.message || e)))) return;
        throw e;
      });
    });
  }

  var jsPdfLoading = null;
  function loadJsPdf() {
    if (window.jspdf) return Promise.resolve(window.jspdf);
    if (jsPdfLoading) return jsPdfLoading;
    jsPdfLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "vendor/jspdf.umd.min.js";
      s.onload = function () { resolve(window.jspdf); };
      s.onerror = function () { jsPdfLoading = null; reject(new Error("jsPDF non caricato")); };
      document.head.appendChild(s);
    });
    return jsPdfLoading;
  }

  // PDF A4, Times 12pt, margini 2,5 cm: stessa impaginazione della stampa web.
  function pdfFromText(text, filename, title) {
    return loadJsPdf().then(function (lib) {
      var doc = new lib.jsPDF({ unit: "mm", format: "a4" });
      var M = 25, W = 210 - 2 * M, H = 297, LH = 6.4;
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      if (title) doc.setProperties({ title: title });
      var y = M;
      String(text || "").split("\n").forEach(function (para) {
        var lines = para === "" ? [""] : doc.splitTextToSize(para, W);
        lines.forEach(function (ln) {
          if (y + LH > H - M) { doc.addPage(); y = M; }
          doc.text(ln, M, y);
          y += LH;
        });
      });
      return saveAndShare(doc.output("blob"), filename, title);
    });
  }

  // Tasto "Indietro" di Android: chiude modali, torna alla home della sezione, poi esce.
  if (App && App.addListener) {
    App.addListener("backButton", function () {
      var modals = document.querySelectorAll(".modal");
      for (var i = modals.length - 1; i >= 0; i--) {
        if (!modals[i].hidden) {
          var c = modals[i].querySelector(".modal__close");
          if (c) { c.click(); } else { modals[i].hidden = true; }
          return;
        }
      }
      var sec = document.querySelector(".section.is-active");
      var back = sec && sec.querySelector(".view:not([hidden]) .btn--back");
      if (back) { back.click(); return; }
      var firstTab = document.querySelector('.tab[data-section="codici"]');
      if (firstTab && !firstTab.classList.contains("is-active")) { firstTab.click(); return; }
      App.exitApp();
    });
  }

  if (StatusBar && StatusBar.setStyle) {
    try { StatusBar.setStyle({ style: "DARK" }); } catch (e) {}
  }

  window.InIureNative = { isNative: true, saveAndShare: saveAndShare, pdfFromText: pdfFromText };
})();
