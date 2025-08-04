import jwt from 'jsonwebtoken';

export const adminLogin = (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@28degreeswest.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, {
    expiresIn: '2h'
  });

  res.status(200).json({ token });
};
