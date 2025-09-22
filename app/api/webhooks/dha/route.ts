import { sendSms } from "@/lib/actions/sms";

export async function POST(request: Request) {

    const body = await request.json();
    console.log("DHA Webhook received:", body);

    // This webhook triggers only if the Home Affairs status has changed from its previously recorded status.

    // the expected body of the webhook is {
    //     "DateStamp": "2023-02-04 14:23", 
    //     "IsDhaOffline": true/false
    // }

    // send an SMS to the admin to notify them of the status change

    await sendSms(`${process.env.SMS_NUMBER}`, 
        `DHA Webhook received. DHA Offline Status: ${body.IsDhaOffline}. Timestamp: ${body.DateStamp}`
    );

    return new Response("DHA Webhook processed", { status: 200 });

}