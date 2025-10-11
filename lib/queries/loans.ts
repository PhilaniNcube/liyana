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

    // Decrypt sensitive application fields if present and add additional fields
    if (loan.application && loan.application.id_number) {
        try {
            const decryptedId = decryptValue(loan.application.id_number);
            // Add the decrypted ID number as an additional property
            (loan.application as any).id_number_decrypted = decryptedId;
        } catch (e) {
            console.warn("Failed to decrypt application id_number", e);
            (loan.application as any).id_number_decrypted = null;
        }
    }

    // Fetch profile separately and add to application
    if (loan.application?.user_id) {
        try {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", loan.application.user_id)
                .single();
            
            if (!profileError && profile) {
                // Set the profile as a single object for consistency with PersonalInfoCard expectations
                (loan.application as any).profile = profile;
                
                // Set email - prioritize profile email, then auth email as fallback
                if (profile.email) {
                    (loan.application as any).email = profile.email;
                } else {
                    // If no profile email, try to get it from auth user
                    try {
                        const { data: authUser } = await supabase.auth.admin.getUserById(
                            loan.application.user_id
                        );
                        if (authUser?.user?.email) {
                            (loan.application as any).email = authUser.user.email;
                        }
                    } catch (error) {
                        console.warn("Could not fetch auth user email for application");
                    }
                }
            } else {
                console.warn("Could not fetch profile for application:", profileError?.message);
                // Still try to get email from auth user as fallback
                try {
                    const { data: authUser } = await supabase.auth.admin.getUserById(
                        loan.application.user_id
                    );
                    if (authUser?.user?.email) {
                        (loan.application as any).email = authUser.user.email;
                    }
                } catch (error) {
                    console.warn("Could not fetch auth user email for application");
                }
            }
        } catch (error) {
            console.warn("Error fetching profile:", error);
        }
    }

    return loan;
}