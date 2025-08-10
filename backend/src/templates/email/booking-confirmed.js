/**
 * Small, self-contained template function.
 * Replace branding, colors, and content as you wish.
 */
export function bookingConfirmedTemplate({
  customerName = '',
  itemName = '',
  itemId = '',
  quantity = 1,
  date = '',
  currency = 'usd',
  amountTotal = 0, // in cents
  bookingRef = '',
  appBaseUrl = '',
}) {
  const amount = (Number(amountTotal || 0) / 100).toFixed(2).toString().replace(/^NaN$/, '0.00');
  const niceCurrency = (currency || 'usd').toUpperCase();
  const dateStr = date ? new Date(date).toDateString() : 'TBA';
  const safeName = customerName || 'Guest';

  const bookingLink = appBaseUrl
    ? `${appBaseUrl}/bookings/my?ref=${encodeURIComponent(bookingRef || itemId)}`
    : '#';

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Your Booking is Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f8;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0b1b2b;color:#fff;padding:24px 24px;">
              <h1 style="margin:0;font-size:20px;">28 Degrees West</h1>
              <p style="margin:6px 0 0 0;font-size:14px;opacity:.85;">Booking Confirmation</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px 0;font-size:16px;">Hi ${safeName},</p>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.5;">
                Thank you for your purchase! Your booking has been confirmed.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #eee;border-radius:8px;">
                <tr>
                  <td style="padding:12px 16px;font-size:14px;">Item</td>
                  <td style="padding:12px 16px;font-size:14px;font-weight:bold;text-align:right;">${itemName || ('Booking ' + itemId)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:14px;">Date</td>
                  <td style="padding:12px 16px;font-size:14px;text-align:right;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:14px;">Quantity</td>
                  <td style="padding:12px 16px;font-size:14px;text-align:right;">${quantity}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:14px;">Total Paid</td>
                  <td style="padding:12px 16px;font-size:14px;text-align:right;">${niceCurrency} ${amount}</td>
                </tr>
                ${bookingRef ? `
                <tr>
                  <td style="padding:12px 16px;font-size:14px;">Reference</td>
                  <td style="padding:12px 16px;font-size:14px;text-align:right;">${bookingRef}</td>
                </tr>` : ``}
              </table>

              <p style="margin:16px 0 8px 0;font-size:14px;">
                You can view your booking details here:
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${bookingLink}" style="display:inline-block;background:#0b1b2b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
                  View Booking
                </a>
              </p>

              <p style="margin:0;color:#666;font-size:12px;line-height:1.5;">
                If you have any questions, reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f0f2f5;color:#666;font-size:12px;">
              © ${new Date().getFullYear()} 28 Degrees West. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
