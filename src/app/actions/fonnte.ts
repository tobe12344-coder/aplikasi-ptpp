'use server';

export async function sendWhatsAppNotification(message: string) {
  const token = 'CuGgJDvoXw1ULh5QT8ui';
  const targetNumbers = '085399770069,085298099251';

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: new URLSearchParams({
        target: targetNumbers,
        message: message,
        countryCode: '62', // Default country code for Indonesia
      }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.status) {
      console.error('Fonnte API Error:', data);
      return { success: false, error: data.reason || 'Failed to send WhatsApp message' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Fonnte Request Error:', error);
    return { success: false, error: 'Internal server error while calling Fonnte API' };
  }
}
