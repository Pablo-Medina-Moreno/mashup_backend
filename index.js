// index.js
require("dotenv").config();
const app = require("./server");

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
