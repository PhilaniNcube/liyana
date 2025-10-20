import { getApprovedApplications } from "@/lib/queries/approved_loans";
import { LoansPageClient } from "./loans-page-client";
import { get } from "http";
import { getMaxMoneyCashBoxes } from "@/lib/utils/max-money";

interface LoansPageProps {
  searchParams: Promise<{
    fromDate?: string;
    toDate?: string;
  }>;
}

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const { fromDate, toDate } = await searchParams;

  // Fetch loans with server-side filtering
  const approvedLoans = await getApprovedApplications({
    limit: 200,
    fromDate,
    toDate,
  });

  

  return <LoansPageClient initialLoans={approvedLoans} />;
}
