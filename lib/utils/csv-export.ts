/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Convert declined applications data to CSV format
 */
export function convertDeclinedApplicationsToCSV(data: any[]): string {
  // Define CSV headers
  const headers = [
    'User Name',
    'Email',
    'Phone Number',
    'ID Number',
    'Decline Reason',
    'Application Date',
    'Application Amount',
    'Credit Check Status',
    'Credit Check Date',
    'Last Event Date',
    'Application ID',
    'User ID'
  ];

  // Convert data to CSV rows
  const rows = data.map(item => {
    const profile = item.profile;
    const app = item.application;
    const check = item.credit_check;
    const lastEvent = app?.created_at || check?.checked_at || profile?.created_at;

    return [
      profile?.full_name || 'Unknown',
      profile?.email || '',
      profile?.phone_number || '',
      item.id_number || '',
      getReason(item.reason),
      app?.created_at ? new Date(app.created_at).toLocaleDateString() : '',
      app?.application_amount || '',
      check?.status ? check.status.charAt(0).toUpperCase() + check.status.slice(1) : '',
      check?.checked_at ? new Date(check.checked_at).toLocaleDateString() : '',
      lastEvent ? new Date(lastEvent).toLocaleDateString() : '',
      app?.id || '',
      profile?.id || ''
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => 
      row.map(field => {
        // Escape fields that contain commas, quotes, or newlines
        const fieldStr = String(field || '');
        if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
          return `"${fieldStr.replace(/"/g, '""')}"`;
        }
        return fieldStr;
      }).join(',')
    )
    .join('\n');

  return csvContent;
}

/**
 * Format reason for CSV export
 */
function getReason(reason: string): string {
  switch (reason) {
    case 'declined_application':
      return 'Declined Application';
    case 'failed_credit_check':
      return 'Credit Check Failed';
    case 'both':
      return 'Declined Application, Credit Check Failed';
    default:
      return reason || '';
  }
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(startDate?: Date, endDate?: Date): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const start = startDate ? startDate.toISOString().split('T')[0] : 'all';
  const end = endDate ? endDate.toISOString().split('T')[0] : 'all';
  
  return `declined-loans_${start}_to_${end}_${timestamp}.csv`;
}

/**
 * Trigger browser download of CSV content
 */
export function downloadCSV(content: string, filename: string): void {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}