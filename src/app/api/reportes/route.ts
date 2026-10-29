import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DailyReport } from "@/lib/types";

// GET: Consultar los reportes diarios guardados en Supabase
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("reportes_diarios")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("Error al obtener reportes:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const reports: DailyReport[] = [];
    if (data) {
      data.forEach((row: any) => {
        // Filtrar recordatorios, protocolos y configuraciones del sistema
        if (
          row.report_id?.startsWith("REM-") ||
          row.report_id?.startsWith("CONFIG_") ||
          row.report_id?.startsWith("ACT-")
        ) {
          return;
        }

        const rowData = row.data as DailyReport;
        if (rowData && typeof rowData === "object") {
          // Garantizar que tenga los campos clave
          reports.push({
            ...rowData,
            id: rowData.id || row.report_id,
            lote: rowData.lote || row.lote || "Proyecto Vainilla",
            responsable: rowData.responsable || row.responsable || "GUIMARE",
            fechaReporte: rowData.fechaReporte || row.fecha_reporte || new Date().toISOString().split("T")[0],
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (err: any) {
    console.error("Excepción al consultar reportes:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Guardar o actualizar un reporte diario en Supabase con Service Role
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report: DailyReport = body.report;

    if (!report || !report.id) {
      return NextResponse.json(
        { success: false, error: "Objeto de reporte inválido o sin ID" },
        { status: 400 }
      );
    }

    const loteVal = report.lote || report.area || "Proyecto Vainilla";
    const respVal = report.responsable || "GUIMARE";
    const fechaVal = report.fechaReporte || new Date().toISOString().split("T")[0];

    const { error } = await supabaseAdmin.from("reportes_diarios").upsert(
      [
        {
          report_id: report.id,
          lote: loteVal,
          responsable: respVal,
          fecha_reporte: fechaVal,
          data: report,
        },
      ],
      { onConflict: "report_id" }
    );

    if (error) {
      console.error("Error al guardar reporte en Supabase:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: report.id,
      message: "Reporte guardado exitosamente en la base de datos",
    });
  } catch (err: any) {
    console.error("Excepción al guardar reporte:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
