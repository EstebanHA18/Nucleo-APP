// Servicio de Impresión Térmica para Navegador / Controladores de Impresora POS (80mm y 58mm)

export interface PrintThermalOptions {
  format?: "80mm" | "58mm" | "letter" | string;
  title?: string;
  autoClose?: boolean;
}

/**
 * Imprime un elemento HTML en formato de ticket térmico continuo (80mm o 58mm)
 * Aislando completamente el ticket en un iframe limpio para evitar que se impriman
 * fondos oscuros, modales, botones o múltiples páginas en blanco.
 */
export const printThermalReceipt = (
  elementId: string,
  format: "80mm" | "58mm" | "letter" | string = "80mm",
  title = "Ticket_Termico"
) => {
  if (typeof window === "undefined") return;

  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.warn(`[printThermalReceipt] Elemento no encontrado: #${elementId}. Fallback a window.print()`);
    window.print();
    return;
  }

  // Dimensiones milimétricas exactas según el rollo de papel térmico
  const widthMm = format === "58mm" ? "54mm" : format === "letter" ? "140mm" : "76mm";
  const fontSize = format === "58mm" ? "10px" : "11px";

  // Reutilizar o crear iframe oculto para la impresión
  let iframe = document.getElementById("pos-thermal-print-frame") as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "pos-thermal-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);
  }

  // Clonar el contenido del ticket
  const ticketHtml = sourceElement.innerHTML;

  // Plantilla HTML optimizada exclusivamente para papel térmico continuo
  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: ${widthMm} auto;
            margin: 0mm 0mm 0mm 0mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "SF Mono", "Consolas", "Courier New", Courier, monospace !important;
            font-size: ${fontSize} !important;
            line-height: 1.25 !important;
            width: ${widthMm} !important;
            overflow: visible !important;
          }
          .thermal-wrapper {
            width: ${widthMm} !important;
            max-width: ${widthMm} !important;
            margin: 0 auto !important;
            padding: 2mm 3mm 4mm 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .font-bold, .font-extrabold { font-weight: 700 !important; }
          .uppercase { text-transform: uppercase !important; }
          .italic { font-style: italic !important; }
          .flex { display: flex !important; }
          .justify-between { justify-content: space-between !important; }
          .items-center { align-items: center !important; }
          .truncate {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          /* Bordes de división con contraste térmico nítido */
          .border-b, .border-t, .border-dashed {
            border-color: #000000 !important;
            border-style: dashed !important;
            border-width: 1px 0 0 0 !important;
          }
          .border-b {
            border-width: 0 0 1px 0 !important;
          }
          /* Grayscale contrast para el logotipo */
          img {
            max-width: 100% !important;
            height: auto !important;
            filter: grayscale(100%) contrast(160%) !important;
            display: block !important;
            margin: 0 auto 2mm auto !important;
          }
          /* Ocultar elementos no imprimibles */
          .no-print, button, svg {
            display: none !important;
          }
          /* Eliminar márgenes y espacios innecesarios */
          p { margin: 1px 0 !important; }
          div { box-shadow: none !important; }
        </style>
      </head>
      <body>
        <div class="thermal-wrapper">
          ${ticketHtml}
        </div>
      </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(printDocumentHtml);
    doc.close();

    // Esperar a que rendericen las imágenes (logo) antes de llamar a print
    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch (err) {
        console.error("Error al imprimir desde iframe:", err);
        window.print();
      }
    }, 250);
  }
};
