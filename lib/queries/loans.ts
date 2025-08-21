import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";

// Fetch a single approved loan including its originating application
export async function getLoan(id: number) {
    const supabase = await createClient();

    const { data: loan, error: loanError } = await supabase
        .from("approved_loans")
        .select(
            `
            *,
            application:applications(*)
        `
        )
        .eq("id", id)
        .single();

    if (loanError || !loan) {
        console.error(`Failed to fetch loan data ${loanError?.message}`);
        throw new Error("Failed to fetch loan");
    }

    // Decrypt sensitive application fields if present
    if (loan.application && loan.application.id_number) {
        try {
            loan.application.id_number = decryptValue(loan.application.id_number);
        } catch (e) {
            console.warn("Failed to decrypt application id_number", e);
        }
    }

    return loan;
}