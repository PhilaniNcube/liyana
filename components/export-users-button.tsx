"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  decrypted_id_number: string | null; // Changed to expect decrypted value
  role: string;
  created_at: string;
}

interface ExportUsersButtonProps {
  users: UserProfile[];
  totalUsersWithoutApplications: number;
}

export function ExportUsersButton({
  users,
  totalUsersWithoutApplications,
}: ExportUsersButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);

    try {
      // CSV headers
      const headers = [
        "ID",
        "Full Name",
        "Email",
        "Phone Number",
        "ID Number",
        "Role",
        "Registration Date",
        "Days Since Registration",
      ];

      // CSV rows
      const rows = users.map((user) => {
        const daysSinceRegistration = Math.floor(
          (new Date().getTime() - new Date(user.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        return [
          user.id,
          user.full_name || "No name",
          user.email || "No email",
          user.phone_number || "No phone",
          user.decrypted_id_number || "Not provided",
          user.role,
          new Date(user.created_at).toLocaleDateString(),
          daysSinceRegistration.toString(),
        ];
      });

      // Create CSV content
      const csvContent = [headers, ...rows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users-without-applications-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${users.length} Declined Loans to CSV file`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export users");
    } finally {
      setIsExporting(false);
    }
  };

  if (users.length === 0) {
    return null;
  }

  return (
    <Button
      onClick={exportToCSV}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" />
      )}
      Export CSV ({totalUsersWithoutApplications} users)
    </Button>
  );
}
