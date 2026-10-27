import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SECTIONS_DATA, ActivitySection } from "@/lib/actividades-data";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("reportes_diarios")
      .select("data")
      .eq("report_id", "CONFIG_ACTIVIDADES_SECTIONS")
      .single();

    if (error || !data?.data) {
      const total = SECTIONS_DATA.reduce((acc, s) => acc + s.items.length, 0);
      return NextResponse.json({
        success: true,
        sections: SECTIONS_DATA,
        totalCount: total,
      });
    }

    const rowData = data.data as any;
    const list: ActivitySection[] =
      Array.isArray(rowData?.sections) && rowData.sections.length > 0
        ? rowData.sections
        : SECTIONS_DATA;

    const total = list.reduce((acc, s) => acc + (s.items?.length || 0), 0);

    return NextResponse.json({
      success: true,
      sections: list,
      totalCount: total,
      updated_at: rowData?.updated_at || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message,
        sections: SECTIONS_DATA,
        totalCount: SECTIONS_DATA.reduce((acc, s) => acc + s.items.length, 0),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sections } = body;

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, error: "La lista de secciones de actividades es requerida y debe ser un array." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const totalCount = sections.reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0);

    const { error } = await supabaseAdmin.from("reportes_diarios").upsert(
      [
        {
          report_id: "CONFIG_ACTIVIDADES_SECTIONS",
          lote: "Configuración Lista de Actividades",
          responsable: "Administrador ITEC",
          fecha_reporte: now.split("T")[0],
          data: {
            tipo: "configuracion_actividades_secciones",
            totalCount,
            sections,
            updated_at: now,
          },
        },
      ],
      { onConflict: "report_id" }
    );

    if (error) {
      console.error("Error al guardar CONFIG_ACTIVIDADES_SECTIONS en Supabase:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      totalCount,
      sections,
      updated_at: now,
    });
  } catch (err: any) {
    console.error("Error en POST /api/actividades-catalogo:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
