import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DailyReport, ActivityProtocol } from "./types";
import { SECTIONS_DATA, RECOMENDACIONES_DATA } from "./actividades-data";

// Helper para convertir URLs de imágenes o blobs a DataURL Base64
async function getBase64Image(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:image")) return url;

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("No se pudo cargar la imagen para el PDF:", err);
    return null;
  }
}

export async function generateDailyReportPDF(report: DailyReport) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Colores corporativos ITEC / Amazon Vanilla
  const greenHeader = [28, 59, 36]; // #1C3B24
  const lightGreen = [240, 248, 242];
  const gold = [200, 148, 78];

  // 1. Encabezado principal
  doc.setFillColor(greenHeader[0], greenHeader[1], greenHeader[2]);
  doc.rect(0, 0, 210, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INFORME DIARIO - CULTIVO DE VAINILLA", 105, 11, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("SEGUIMIENTO Y CONTROL DEL CULTIVO | ITEC ECUADOR - TERRITORIO WAORANI", 105, 18, { align: "center" });

  // 2. Rango de Fechas y Responsable
  autoTable(doc, {
    startY: 29,
    theme: "grid",
    head: [["RANGO DE FECHAS DEL INFORME", "UBICACIÓN Y RESPONSABLE"]],
    body: [
      [
        `Desde: ${report.fechaDesde}      Hasta: ${report.fechaHasta}`,
        `Lote / Área: ${report.lote}\nResponsable: ${report.responsable}`,
      ],
    ],
    headStyles: { fillColor: greenHeader as [number, number, number], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // 3. Condiciones del Día
  const condY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: condY,
    theme: "grid",
    head: [["CONDICIONES DEL DÍA"]],
    body: [
      [
        `Fecha: ${report.fechaReporte}   |   Temperatura: Mín ${report.tempMin}°C - Máx ${report.tempMax}°C   |   Humedad: ${report.humedad}%   |   Clima: ${report.clima} ${report.climaOtro ? `(${report.climaOtro})` : ""}`,
      ],
    ],
    headStyles: { fillColor: [42, 86, 55], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // 4. Actividades Realizadas
  const actY = (doc as any).lastAutoTable.finalY + 4;
  const actRows = report.actividades.map((act) => [
    act.id.toString(),
    act.nombre,
    act.descripcion || "-",
    act.areaLote || "-",
    act.realizado ? "SI [X]" : "NO [ ]",
  ]);

  autoTable(doc, {
    startY: actY,
    theme: "grid",
    head: [["N°", "Actividad", "Descripción / Observaciones", "Área / Lote", "Realizado"]],
    body: actRows,
    headStyles: { fillColor: greenHeader as [number, number, number], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 75 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20, halign: "center" },
    },
    styles: { fontSize: 8, cellPadding: 1.8 },
  });

  // 5. Herramientas Utilizadas y Estado General
  const toolsY = (doc as any).lastAutoTable.finalY + 4;
  const usedTools = report.herramientas
    .filter((t) => t.utilizada)
    .map((t) => `• ${t.nombre}`)
    .join("\n") || "Ninguna reportada";

  const statusText = [
    `• Desarrollo vegetativo: ${report.estadoCultivo.desarrolloVegetativo}`,
    `• Floración: ${report.estadoCultivo.floracion}`,
    `• Formación de vainas: ${report.estadoCultivo.formacionVainas}`,
    `• Estado fitosanitario: ${report.estadoCultivo.estadoFitosanitario}`,
  ].join("\n");

  autoTable(doc, {
    startY: toolsY,
    theme: "grid",
    head: [["HERRAMIENTAS UTILIZADAS", "ESTADO GENERAL DEL CULTIVO"]],
    body: [[usedTools, statusText]],
    headStyles: { fillColor: [42, 86, 55], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  // 6. Insumos Aplicados
  const insY = (doc as any).lastAutoTable.finalY + 4;
  const insRows = report.insumos.length > 0
    ? report.insumos.map((i) => [i.insumo, i.dosis, i.metodo, i.areaLote])
    : [["Sin aplicación de insumos en esta jornada", "-", "-", "-"]];

  autoTable(doc, {
    startY: insY,
    theme: "grid",
    head: [["Insumo Aplicado", "Dosis", "Método de Aplicación", "Área / Lote"]],
    body: insRows,
    headStyles: { fillColor: greenHeader as [number, number, number], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // 7. Observaciones y Eventos Importantes
  const obsY = (doc as any).lastAutoTable.finalY + 4;
  autoTable(doc, {
    startY: obsY,
    theme: "grid",
    head: [["OBSERVACIONES / EVENTOS IMPORTANTES"]],
    body: [[report.observaciones || "Sin observaciones adicionales reportadas para este día."]],
    headStyles: { fillColor: [42, 86, 55], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  // 8. REGISTRO FOTOGRÁFICO DE CAMPO (FOTO 1, FOTO 2, FOTO 3)
  let currentY = (doc as any).lastAutoTable.finalY + 4;

  // Si no hay suficiente espacio para las fotos (mínimo 58mm), agregar página nueva
  if (currentY + 58 > 275) {
    doc.addPage();
    currentY = 16;
  }

  // Título de la sección de fotos
  doc.setFillColor(greenHeader[0], greenHeader[1], greenHeader[2]);
  doc.rect(14, currentY, 182, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("REGISTRO FOTOGRÁFICO DE CAMPO", 105, currentY + 4.2, { align: "center" });

  const photoY = currentY + 8;
  const photoW = 56;
  const photoH = 40;
  const photoPositions = [14, 77, 140]; // x1, x2, x3 centradas

  // Cargar fotos en paralelo
  const [img1, img2, img3] = await Promise.all([
    getBase64Image(report.foto1Url),
    getBase64Image(report.foto2Url),
    getBase64Image(report.foto3Url),
  ]);

  const images = [
    { label: "Foto 1", data: img1, x: photoPositions[0] },
    { label: "Foto 2", data: img2, x: photoPositions[1] },
    { label: "Foto 3", data: img3, x: photoPositions[2] },
  ];

  for (const img of images) {
    if (img.data) {
      try {
        doc.addImage(img.data, "JPEG", img.x, photoY, photoW, photoH, undefined, "FAST");
        // Borde fino
        doc.setDrawColor(200, 200, 200);
        doc.rect(img.x, photoY, photoW, photoH);
      } catch (err) {
        console.warn(`Error al incrustar ${img.label}:`, err);
        doc.setFillColor(245, 245, 245);
        doc.rect(img.x, photoY, photoW, photoH, "F");
      }
    } else {
      // Placeholder si no hay foto
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.rect(img.x, photoY, photoW, photoH, "FD");
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.text("Sin foto registrada", img.x + photoW / 2, photoY + photoH / 2, { align: "center" });
    }

    // Pie de la foto
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.text(img.label, img.x + photoW / 2, photoY + photoH + 4, { align: "center" });
  }

  // Footer institucional en todas las páginas
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Amazon Vanilla By Waorani People | ITEC Ecuador - Innovación para un campo sostenible (Pág. ${i}/${pageCount})`,
      105,
      pageHeight - 6,
      { align: "center" }
    );
  }

  doc.save(`Informe_Vainilla_${report.lote.replace(/\s+/g, "_")}_${report.fechaReporte}.pdf`);
}

export async function generateActivityProtocolPDF(protocol: ActivityProtocol) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const greenHeader = [28, 59, 36];

  // 1. Encabezado principal
  doc.setFillColor(greenHeader[0], greenHeader[1], greenHeader[2]);
  doc.rect(0, 0, 210, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("LISTADO INTEGRAL DE ACTIVIDADES", 105, 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("CULTIVO DE VAINILLA EN INVERNADERO | ITEC ECUADOR", 105, 17, { align: "center" });
  doc.setFontSize(7.5);
  doc.text("Mantenimiento, producción, beneficiado, empaque y seguimiento", 105, 22, { align: "center" });

  // 2. Metadatos del Protocolo
  autoTable(doc, {
    startY: 29,
    theme: "grid",
    head: [["DATOS DEL PROTOCOLO", "ESTADO DE EJECUCIÓN"]],
    body: [
      [
        `Código: ${protocol.id}\nFecha: ${protocol.fecha}\nInvernadero / Lote: ${protocol.lote || "No especificado"}\nResponsable: ${protocol.responsable || "No especificado"}`,
        `Actividades Completadas: ${protocol.completadas} de ${protocol.totalActividades}\nPorcentaje de Avance: ${protocol.porcentaje}%\nEstado: ${protocol.porcentaje >= 80 ? "Alto Cumplimiento" : protocol.porcentaje >= 50 ? "En Progreso" : "Inicial"}`,
      ],
    ],
    headStyles: {
      fillColor: [28, 59, 36],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
  });

  // 3. Fases y Actividades
  let lastY = (doc as any).lastAutoTable.finalY + 3;

  const tableBody: any[] = [];
  SECTIONS_DATA.forEach((sec) => {
    const secDone = sec.items.filter((_, idx) => protocol.checkedItems[`${sec.id}-${idx}`]).length;
    tableBody.push([
      {
        content: `FASE ${sec.id}: ${sec.title} (${secDone}/${sec.items.length})`,
        colSpan: 2,
        styles: { fillColor: [40, 80, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      },
    ]);

    sec.items.forEach((item, idx) => {
      const isChecked = !!protocol.checkedItems[`${sec.id}-${idx}`];
      tableBody.push([
        item,
        {
          content: isChecked ? "[ X ] REALIZADO" : "[   ] PENDIENTE",
          styles: {
            textColor: isChecked ? [20, 120, 40] : [120, 120, 120],
            fontStyle: isChecked ? "bold" : "normal",
            halign: "center",
          },
        },
      ]);
    });
  });

  // Sección Adicional: Recomendaciones Técnicas
  tableBody.push([
    {
      content: `RECOMENDACIONES AGRONÓMICAS & DIRECTRICES DE CAMPO`,
      colSpan: 2,
      styles: { fillColor: [40, 80, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    },
  ]);

  RECOMENDACIONES_DATA.forEach((rec, idx) => {
    tableBody.push([
      `•  ${rec}`,
      {
        content: "DIRECTRIZ TÉCNICA",
        styles: {
          textColor: [140, 100, 20],
          fontStyle: "bold",
          fontSize: 6.5,
          halign: "center",
        },
      },
    ]);
  });

  autoTable(doc, {
    startY: lastY,
    theme: "striped",
    head: [["ACTIVIDAD AGRONÓMICA / CONTROL", "ESTADO"]],
    body: tableBody,
    headStyles: {
      fillColor: [28, 59, 36],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 40, halign: "center" },
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
  });

  lastY = (doc as any).lastAutoTable.finalY + 4;
  if (lastY > 250) {
    doc.addPage();
    lastY = 20;
  }

  // 4. Observaciones y Firma
  autoTable(doc, {
    startY: lastY,
    theme: "grid",
    head: [["OBSERVACIONES Y NOVEDADES DE CAMPO", "FIRMA Y CONFORMIDAD"]],
    body: [
      [
        protocol.observaciones || "Sin observaciones adicionales registradas durante esta verificación.",
        `Responsable: ${protocol.responsable || "____________________"}\n\n__________________________________\nFirma Técnico / Inspector ITEC`,
      ],
    ],
    headStyles: {
      fillColor: [28, 59, 36],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
  });

  // Footer en todas las páginas
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Amazon Vanilla By Waorani People | ITEC Ecuador - Innovación para un campo sostenible (Pág. ${i}/${pageCount})`,
      105,
      pageHeight - 6,
      { align: "center" }
    );
  }

  const cleanLote = (protocol.lote || "Invernadero").replace(/\s+/g, "_");
  doc.save(`Protocolo_Actividades_Vainilla_${cleanLote}_${protocol.fecha || "registro"}.pdf`);
}
