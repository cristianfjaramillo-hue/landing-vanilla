import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DailyReport } from "./types";

export function generateDailyReportPDF(report: DailyReport) {
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

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Amazon Vanilla By Waorani People | ITEC Ecuador - Innovación para un campo sostenible",
    105,
    pageHeight - 6,
    { align: "center" }
  );

  doc.save(`Informe_Vainilla_${report.lote.replace(/\s+/g, "_")}_${report.fechaReporte}.pdf`);
}
