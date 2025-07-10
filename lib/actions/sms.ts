import { headers } from "next/headers";

const SMS_PORTAL_CLIENT_ID = process.env.SMS_PORTAL_CLIENT_ID;
const SMS_PORTAL_API_SECRET = process.env.SMS_PORTAL_API_SECRET;

export async function sendSms(
  phoneNumber: string,
  message: string
): Promise<void> {
  if (!SMS_PORTAL_CLIENT_ID || !SMS_PORTAL_API_SECRET) {
    throw new Error("SMS Portal credentials are not configured");
  }

  const apiUrl = "https://rest.smsportal.com/v3/BulkMessages";

  const apiCredentials = `${SMS_PORTAL_CLIENT_ID}:${SMS_PORTAL_API_SECRET}`;

  // basic validation
  const buff = Buffer.from(apiCredentials);
  const base64Credentials = buff.toString("base64");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64Credentials}`,
      "Content-Type": "text/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          content: `${message}`,
          destination: `${phoneNumber}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send SMS: ${response.statusText}`);
  }

  const responseData = await response.json();

  if (responseData.error) {
    throw new Error(`SMS Portal error: ${responseData.error}`);
  }

  console.log("SMS sent successfully:", responseData);

  return;
}
