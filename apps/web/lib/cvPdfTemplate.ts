import PDFDocument from "pdfkit";

export interface CVAjustadoExperiencia {
  puesto: string;
  empresa: string;
  fechas: string;
  descripcion: string[];
}

export interface CVAjustadoEducacion {
  carrera: string;
  institucion: string;
  anio?: string;
}

export interface CVAjustadoIdioma {
  idioma: string;
  nivel: string;
}

export interface CVAjustadoData {
  nombre: string;
  tituloProfesional: string;
  resumen: string;
  contacto: {
    email?: string;
    telefono?: string;
    linkedin?: string;
    ciudad?: string;
  };
  habilidades: string[];
  experiencia: CVAjustadoExperiencia[];
  educacion: CVAjustadoEducacion[];
  idiomas: CVAjustadoIdioma[];
}

const ETIQUETAS = {
  es: {
    resumen: "RESUMEN PROFESIONAL",
    habilidades: "HABILIDADES",
    experiencia: "EXPERIENCIA LABORAL",
    educacion: "EDUCACIÓN",
    idiomas: "IDIOMAS",
  },
  en: {
    resumen: "PROFESSIONAL SUMMARY",
    habilidades: "SKILLS",
    experiencia: "WORK EXPERIENCE",
    educacion: "EDUCATION",
    idiomas: "LANGUAGES",
  },
};

// Colores consistentes con el resto de la app (ver dashboard/vacantes).
const AZUL = "#2563EB";
const GRIS_OSCURO = "#0F2744";
const GRIS = "#475569";
const GRIS_CLARO = "#94A3B8";
const GRIS_LINEA = "#E2E8F0";

const MARGEN = 50;

// Fuentes estándar de PDF (Helvetica) — no requieren descargar/embeber
// nada, y su WinAnsiEncoding por defecto ya cubre acentos y ñ en
// español, así que evitamos por completo el problema de fuentes remotas.
function seccionTitulo(doc: PDFKit.PDFDocument, texto: string) {
  doc.moveDown(0.9);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(GRIS_OSCURO);
  doc.text(texto, { characterSpacing: 0.6 });
  const y = doc.y + 2;
  doc.moveTo(MARGEN, y).lineTo(doc.page.width - MARGEN, y).strokeColor(GRIS_LINEA).lineWidth(1).stroke();
  doc.moveDown(0.6);
}

export function generarCVPdfBuffer(data: CVAjustadoData, idioma: "es" | "en"): Promise<Buffer> {
  const t = ETIQUETAS[idioma];

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: MARGEN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const anchoUtil = doc.page.width - MARGEN * 2;

    // ── Encabezado ──────────────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(21).fillColor(GRIS_OSCURO).text(data.nombre);
    doc.font("Helvetica-Bold").fontSize(12.5).fillColor(AZUL).text(data.tituloProfesional);
    doc.moveDown(0.4);

    const contactoItems = [data.contacto.email, data.contacto.telefono, data.contacto.linkedin, data.contacto.ciudad]
      .filter(Boolean)
      .join("   ·   ");
    if (contactoItems) {
      doc.font("Helvetica").fontSize(9).fillColor(GRIS).text(contactoItems);
    }

    doc.moveDown(0.5);
    const yLinea = doc.y;
    doc.moveTo(MARGEN, yLinea).lineTo(doc.page.width - MARGEN, yLinea).strokeColor(GRIS_LINEA).lineWidth(1).stroke();
    doc.moveDown(0.7);

    // ── Resumen ─────────────────────────────────────────────────
    if (data.resumen) {
      seccionTitulo(doc, t.resumen);
      doc.font("Helvetica").fontSize(10).fillColor(GRIS).text(data.resumen, { width: anchoUtil, lineGap: 2 });
    }

    // ── Habilidades ─────────────────────────────────────────────
    if (data.habilidades?.length > 0) {
      seccionTitulo(doc, t.habilidades);
      doc.font("Helvetica").fontSize(9.5).fillColor(GRIS).text(data.habilidades.join("   ·   "), {
        width: anchoUtil,
        lineGap: 3,
      });
    }

    // ── Experiencia ─────────────────────────────────────────────
    if (data.experiencia?.length > 0) {
      seccionTitulo(doc, t.experiencia);
      data.experiencia.forEach((exp, i) => {
        if (i > 0) doc.moveDown(0.5);

        const yFila = doc.y;
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(GRIS_OSCURO).text(exp.puesto, MARGEN, yFila, {
          width: anchoUtil * 0.7,
        });
        doc.font("Helvetica").fontSize(8.5).fillColor(GRIS_CLARO).text(exp.fechas, MARGEN, yFila, {
          width: anchoUtil,
          align: "right",
        });

        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(AZUL).text(exp.empresa, { width: anchoUtil });

        exp.descripcion?.forEach((linea) => {
          doc.font("Helvetica").fontSize(9.5).fillColor(GRIS).text(`•  ${linea}`, {
            width: anchoUtil - 8,
            indent: 8,
            lineGap: 1.5,
          });
        });
      });
    }

    // ── Educación ───────────────────────────────────────────────
    if (data.educacion?.length > 0) {
      seccionTitulo(doc, t.educacion);
      data.educacion.forEach((edu, i) => {
        if (i > 0) doc.moveDown(0.3);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(GRIS_OSCURO).text(edu.carrera, { width: anchoUtil });
        doc.font("Helvetica").fontSize(9).fillColor(GRIS).text(
          `${edu.institucion}${edu.anio ? ` · ${edu.anio}` : ""}`,
          { width: anchoUtil }
        );
      });
    }

    // ── Idiomas ─────────────────────────────────────────────────
    if (data.idiomas?.length > 0) {
      seccionTitulo(doc, t.idiomas);
      doc.font("Helvetica").fontSize(9.5).fillColor(GRIS).text(
        data.idiomas.map((idi) => `${idi.idioma} — ${idi.nivel}`).join("   ·   "),
        { width: anchoUtil }
      );
    }

    doc.end();
  });
}
