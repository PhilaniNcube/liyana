import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";

export async function getLoan(id:number) {

    const supabase = await createClient()

    const {data:loan, error:loanError} = await supabase.from("approved_loans").select("*")
    .eq("id", id)
    .single();

   
    if(loanError || !loan) {
        console.error(`Failed to fetch loan data ${loanError?.message}`)
        throw new Error('Failed to fetch loan')
    }

    return loan

}