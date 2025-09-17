import { getDeclinedApplications } from "@/lib/queries/applications";
import { convertDeclinedApplicationsToCSV, generateCSVFilename } from "@/lib/utils/csv-export";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters with defaults
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '1000'); // Large default for CSV export
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // Use fallback dates if not provided (last month)
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startDateObj = start_date ? new Date(start_date) : startOfLastMonth;
    const endDateObj = end_date ? new Date(end_date) : now;

    const startDateISO = startDateObj.toISOString();
    const endDateISO = endDateObj.toISOString();

    // Fetch all declined applications for the date range
    // For CSV export, we want all data, not just a single page
    const allDeclinedUsers = [];
    let currentPage = 1;
    let hasMoreData = true;
    
    // Fetch all pages of data
    while (hasMoreData) {
      const pageData = await getDeclinedApplications(
        currentPage,
        100, // Fetch in chunks of 100
        startDateISO,
        endDateISO
      );
      
      if (pageData.length === 0) {
        hasMoreData = false;
      } else {
        allDeclinedUsers.push(...pageData);
        currentPage++;
        // Safety check to prevent infinite loops
        if (currentPage > 100) {
          hasMoreData = false;
        }
      }
    }

    // Convert to CSV
    const csvContent = convertDeclinedApplicationsToCSV(allDeclinedUsers);
    
    // Generate filename
    const filename = generateCSVFilename(startDateObj, endDateObj);

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export CSV', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}