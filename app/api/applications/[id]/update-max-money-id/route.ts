import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/server";

// Request schema for updating max_money_id
const updateMaxMoneyIdSchema = z.object({
  max_money_id: z.string().min(1, "Max Money ID is required"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const applicationId = parseInt((await params).id);
    if (isNaN(applicationId)) {
      return NextResponse.json(
        { message: "Invalid application ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedInput = updateMaxMoneyIdSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json(
        {
          message: "Invalid input data",
          errors: validatedInput.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update the application with the max_money_id
    const { data, error } = await supabase
      .from("applications")
      .update({ max_money_id: validatedInput.data.max_money_id })
      .eq("id", applicationId)
      .select();

    if (error) {
      console.error("Error updating max_money_id:", error);
      return NextResponse.json(
        { message: "Failed to update Max Money ID" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Max Money ID updated successfully",
      application: data[0],
    });
  } catch (error) {
    console.error("Error updating Max Money ID:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}