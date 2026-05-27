import { kv } from '@vercel/kv';

export default async function handler(req: any, res: any) {
  // Configuração de cabeçalhos CORS para permitir chamadas locais e na nuvem
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const data = await kv.get('controle_frota_db');
      return res.status(200).json(data || {});
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await kv.set('controle_frota_db', body);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Erro na API do Banco de Dados Cloud:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
