'use server';

import { revalidatePath } from 'next/cache';
import {createClaimSchema} from '../schemas'
import { createClient } from '../server';

export const createClaimAction = async (prevState:unknown, formData:FormData) => {

    const supabase = await createClient();

    // check if user is an admin, if not return an error
    const { data: isAdmin, error: userError } = await supabase.rpc('is_admin');
    if (userError || !isAdmin) {
        return {
            success: false,
            errors: { message: "User not authenticated" },
        };
    }

    // Extract and convert form data
    const rawData = {
        policy_id: parseInt(formData.get("policy_id") as string),
        claimant_party_id: formData.get("claimant_party_id") as string,
        claim_number: formData.get("claim_number") as string,
        status: formData.get("status") as string,
        date_filed: new Date(formData.get("date_filed") as string),
        date_of_incident: new Date(formData.get("date_of_incident") as string),
    };

    console.log("Raw data before validation:", rawData);

    const result = createClaimSchema.safeParse(rawData);

    if (!result.success) {
        console.log("Validation errors:", result.error.format());
        // Handle validation errors
        return {
            success: false,
            errors: result.error.format(),
        };
    }

    const claimData = result.data;

    const { error: insertError } = await supabase
        .from('claims')
        .insert({
            policy_id: claimData.policy_id,
            claimant_party_id: claimData.claimant_party_id,
            claim_number: claimData.claim_number,
            status: claimData.status,
            date_filed: claimData.date_filed.toISOString(),
            date_of_incident: claimData.date_of_incident.toISOString(),
        }).select('id');

    if (insertError) {
        console.error(insertError);
        return {
            success: false,
            errors: { message: "Failed to create claim" },
        };
    }

    revalidatePath(`/dashboard/insurance/${claimData.policy_id}`, 'layout');

    return {
        success: true,
        data: claimData,
    };
}