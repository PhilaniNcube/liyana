import { MaxMoneyLoginResponse } from '@/lib/schemas';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user_name = process.env.MAX_MONEY_API_USERNAME;
    const password = process.env.MAX_MONEY_API_PASSWORD;

    if (!user_name || !password) {
      console.error('MAX_MONEY_API_USERNAME or MAX_MONEY_API_PASSWORD environment variables are not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const maxMoneyUrl = process.env.MAX_MONEY_URL;
    if (!maxMoneyUrl) {
        console.error('MAX_MONEY_URL environment variable is not set');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const loginRequest = await fetch(`${maxMoneyUrl}/MaxIntegrate/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name,
        password,
      }),
    });

    
    if (!loginRequest.ok) {
      console.error('Failed to login to Max Money API:', loginRequest);
      return NextResponse.json({ error: 'Failed to login to Max Money API', details: loginRequest.statusText }, { status: loginRequest.status });
    }
    const loginResponse : MaxMoneyLoginResponse = await loginRequest.json();
    
    console.log('Successfully logged in to Max Money API', loginResponse);

    return NextResponse.json(loginResponse, { status: 200 });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
