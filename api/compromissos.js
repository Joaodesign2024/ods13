import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const compromissos = await redis.lrange('compromissos', 0, -1) || [];
      return res.status(200).json(compromissos);
    }

    if (req.method === 'POST') {
      const { nome, cidade, compromisso } = req.body;
      
      if (!nome || !cidade || !compromisso) {
        return res.status(400).json({ message: 'Preencha todos os campos' });
      }

      const novo = {
        id: Date.now(),
        nome,
        cidade,
        compromisso,
        data: new Date().toISOString()
      };

      await redis.lpush('compromissos', novo);
      return res.status(201).json(novo);
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro: ' + error.message });
  }
}
