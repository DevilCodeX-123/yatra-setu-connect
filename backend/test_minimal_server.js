const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => res.send('OK'));

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Minimal server running on http://127.0.0.1:${PORT}`);
    process.exit(0); // Exit immediately after success for testing
});
