import { createClient } from "../server";
import { getCurrentUser } from "./user";

export async function getClaimsByUserId() {

    const supabase = await createClient();

    const user = await getCurrentUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    try {

        // first we need to fetch the party_id of the currently logged in user
        const { data: partyData, error: partyError } = await supabase
            .from("parties")
            .select("id")
            .eq("profile_id", user.id)
            
        // this will return an array of parties, we want to use this array to fetch all claims associated with these parties
        if (partyError) {
            throw partyError;
        }

        const partyIds = partyData?.map((party) => party.id);

        if (!partyIds || partyIds.length === 0) {
            return null; // No parties found for the user
        }

        // now we can fetch all claims associated with these party ids
        const { data: claimsData, error: claimsError } = await supabase
            .from("claims")
            .select("*")
            .in("claimant_party_id", partyIds)
            .order("created_at", { ascending: false });

        if (claimsError) {
            throw claimsError;
        }

        return claimsData;

    } catch (error) {
        console.error("Error fetching claims:", error);
       return null;
    }
}

export async function getAllClaims() {

    const supabase = await createClient();

    try {
        const { data: claimsData, error: claimsError } = await supabase
            .from("claims")
            .select("*, parties!inner(*), policies!inner(*)")
            .order("created_at", { ascending: false });

        if (claimsError) {
            throw claimsError;
        }

        return claimsData;

    } catch (error) {
        console.error("Error fetching claims:", error);
        return null;
    }
}
