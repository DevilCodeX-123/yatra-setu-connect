const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Persistent server running on http://127.0.0.1:${PORT}`);
    // No exit
});
