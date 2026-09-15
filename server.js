import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, 'db.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS compromissos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cidade TEXT NOT NULL,
    compromisso TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

app.get('/api/compromissos', (req, res) => {
  const rows = db.prepare('SELECT * FROM compromissos ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/compromissos', (req, res) => {
  const { nome, cidade, compromisso } = req.body;

  if (!nome || !cidade || !compromisso) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  const stmt = db.prepare('INSERT INTO compromissos (nome, cidade, compromisso) VALUES (?, ?, ?)');
  const result = stmt.run(nome, cidade, compromisso);

  const item = db.prepare('SELECT * FROM compromissos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
