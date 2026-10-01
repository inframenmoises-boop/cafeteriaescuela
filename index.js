const app = require('./server');
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => console.log(`Cafetería disponible en http://localhost:${PORT}`));