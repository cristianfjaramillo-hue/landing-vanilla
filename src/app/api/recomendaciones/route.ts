import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { RECOMENDACIONES_DATA } from "@/lib/actividades-data";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("reportes_diarios")
      .select("data")
      .eq("report_id", "CONFIG_RECOMENDACIONES")
      .single();

    if (error || !data?.data) {
      return NextResponse.json({
        success: true,
        recomendaciones: RECOMENDACIONES_DATA,
        count: RECOMENDACIONES_DATA.length,
      });
    }

    const rowData = data.data as any;
    const list =
      Array.isArray(rowData?.recomendaciones)
        ? rowData.recomendaciones
        : RECOMENDACIONES_DATA;

    return NextResponse.json({
      success: true,
      recomendaciones: list,
      count: list.length,
      updated_at: rowData?.updated_at || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message, recomendaciones: RECOMENDACIONES_DATA },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recomendaciones, customCreated } = body;

    if (!Array.isArray(recomendaciones)) {
      return NextResponse.json(
        { success: false, error: "La lista de recomendaciones es requerida y debe ser un array." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("reportes_diarios").upsert(
      [
        {
          report_id: "CONFIG_RECOMENDACIONES",
          lote: "Configuración General",
          responsable: "Administrador ITEC",
          fecha_reporte: now.split("T")[0],
          data: {
            tipo: "configuracion_recomendaciones",
            cantidad: recomendaciones.length,
            recomendaciones: recomendaciones,
            custom_created: Array.isArray(customCreated) ? customCreated : [],
            updated_at: now,
          },
        },
      ],
      { onConflict: "report_id" }
    );

    if (error) {
      console.error("Error al actualizar CONFIG_RECOMENDACIONES en Supabase:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: recomendaciones.length,
      recomendaciones,
      updated_at: now,
    });
  } catch (err: any) {
    console.error("Error en POST /api/recomendaciones:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
