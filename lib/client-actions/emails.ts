export async function getEmailByResendId(resendId: string) {

    const response = await fetch(`/api/emails/${resendId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch email with ID ${resendId}`);
    }

    const data = await response.json();
    return data;
}


