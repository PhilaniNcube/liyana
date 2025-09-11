import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";


const resend = new Resend(process.env.RESEND_API_KEY);



export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

    const { id } = await params;

    const {data, error} = await resend.emails.get(id);



    if (error) {
        return NextResponse.json({ error: "Failed to fetch email details" }, { status: 500 });
    }

  

    if(!data) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({error: null, data}, { status: 200 });
}