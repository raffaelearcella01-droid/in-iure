/* ============================================================
   In Iure — strato desktop (solo app Electron)
   Viene inserito da scripts/copy-web.js prima di app.js.
   Sul desktop download e anteprima di condivisione funzionano come sul sito
   (Electron mostra la finestra «Salva con nome»); cambia solo il PDF, che viene
   generato direttamente con jsPDF invece di passare dalla finestra di stampa.
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.add("is-desktop-app");

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

  function saveBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
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
      saveBlob(doc.output("blob"), filename);
    });
  }

  window.InIureNative = { isNative: true, isDesktop: true, pdfFromText: pdfFromText };
})();
