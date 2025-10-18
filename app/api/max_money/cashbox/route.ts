import { loginToMaxMoney } from "@/lib/utils/max-money";

const MAX_MONEY_URL = process.env.MAX_MONEY_URL;

export async function GET(request: Request) {
  const loginDetails = await loginToMaxMoney();

  const cashBoxListUrl = `${MAX_MONEY_URL}/MaxIntegrate/cashbox_list`;

  const response = await fetch(cashBoxListUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mle_id: loginDetails.mle_id,
      mbr_id: loginDetails.branch_id,
      user_id: loginDetails.user_id,
      login_token: loginDetails.login_token,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cashbox list request failed:", errorText);
    return new Response("Failed to fetch cashbox list", { status: 500 });
  }

  const cashBoxList = await response.json();
  return new Response(JSON.stringify(cashBoxList), { status: 200 });
}
