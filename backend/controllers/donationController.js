// controllers/donationController.js — MySQL version
const { getDB } = require('../config/db');

exports.createDonation = async (req, res) => {
  try {
    const { donorName, email, amount, cause } = req.body;
    if (!donorName || !amount || !cause)
      return res.status(400).json({ success:false, message:'Name, amount and cause required.' });

    const db = getDB();
    await db.execute(
      'INSERT INTO donations (donor_name,email,amount,cause,user_id) VALUES (?,?,?,?,?)',
      [donorName, email||'', amount, cause, req.user?.id||null]
    );
    res.status(201).json({ success:true, message:`Thank you, ${donorName}! Donation of ₹${amount} for "${cause}" received.` });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};

exports.getDonationStats = async (req, res) => {
  try {
    const db = getDB();
    const [[total]]  = await db.execute('SELECT SUM(amount) AS totalAmount, COUNT(*) AS count FROM donations');
    const [byCause]  = await db.execute('SELECT cause, SUM(amount) AS total, COUNT(*) AS count FROM donations GROUP BY cause ORDER BY total DESC');
    res.status(200).json({ success:true, stats:{ total, byCause } });
  } catch (err) {
    res.status(500).json({ success:false, message:err.message });
  }
};
