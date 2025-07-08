import axios from 'axios';

const url = 'http://localhost:5000/api/users';
try {
  const res = await axios.get(url);
  if (res.status === 200) {
    console.log('Backend is live:', res.status);
  } else {
    console.error('Unexpected status:', res.status);
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Error reaching backend:', err.message);
  process.exitCode = 1;
}
