import { NextRequest, NextResponse } from 'next/server';
import { getReadClient } from '@/lib/supabaseClient';
import {
  fetchQualityAuditSummary,
  fetchRawDataSample,
  RawSampleFilters,
} from '@/lib/dataQualityAudit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceFile = searchParams.get('sourceFile') || undefined;
    const keptParam = searchParams.get('kept');
    const reason = searchParams.get('reason') || undefined;
    const patientId = searchParams.get('patientId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    let keptFilter: boolean | null | undefined = undefined;
    if (keptParam === 'true') keptFilter = true;
    else if (keptParam === 'false') keptFilter = false;

    const filters: RawSampleFilters = {
      sourceFile,
      keptFilter,
      rejectionReason: reason,
      patientId,
      page,
      pageSize,
    };

    const supabase = getReadClient();

    const [summary, sampleResult] = await Promise.all([
      fetchQualityAuditSummary(supabase),
      fetchRawDataSample(supabase, filters),
    ]);

    return NextResponse.json({
      success: true,
      summary,
      sample: sampleResult.rows,
      sampleTotal: sampleResult.total,
      page: sampleResult.page,
      pageSize: sampleResult.pageSize,
      totalPages: sampleResult.totalPages,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener auditoría de calidad de datos.',
      },
      { status: 500 }
    );
  }
}
