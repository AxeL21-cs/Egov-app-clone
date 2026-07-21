export default async function handler(req, res) {
  // The callback is acknowledged but never trusted as payment proof. The app
  // always checks the transaction-details endpoint before displaying status.
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ received: true });
}
