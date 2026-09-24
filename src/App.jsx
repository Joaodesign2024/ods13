import { useEffect, useMemo, useState, useRef } from 'react';

const causas = [
  { emoji: '🏭', titulo: 'Poluição', texto: 'Emissão de gases do efeito estufa pelas indústrias.' },
  { emoji: '🌳', titulo: 'Desmatamento', texto: 'Redução das florestas e perda da biodiversidade.' },
  { emoji: '🔥', titulo: 'Queimadas', texto: 'Liberação de grandes quantidades de CO₂.' },
  { emoji: '🚗', titulo: 'Combustíveis Fósseis', texto: 'Uso excessivo de petróleo, carvão e gás natural.' },
];

const solucoes = [
  { emoji: '♻', titulo: 'Reciclar', texto: 'Separar corretamente resíduos sólidos.' },
  { emoji: '🌞', titulo: 'Energia Limpa', texto: 'Utilizar fontes renováveis sempre que possível.' },
  { emoji: '🌱', titulo: 'Plantar Árvores', texto: 'Reflorestamento e preservação ambiental.' },
];

const weatherCodes = {
  0: 'Céu limpo', 1: 'Parcialmente nublado', 2: 'Parcialmente nublado', 3: 'Encoberto',
  45: 'Neblina', 48: 'Geada', 51: 'Chuvisco leve', 53: 'Chuvisco', 55: 'Chuvisco forte',
  56: 'Chuvisco gelado', 57: 'Chuvisco gelado forte', 61: 'Chuva leve', 63: 'Chuva',
  65: 'Chuva forte', 66: 'Chuva gelada', 67: 'Chuva gelada forte', 71: 'Neve leve',
  73: 'Neve', 75: 'Neve forte', 77: 'Granizo', 80: 'Pancadas de chuva', 81: 'Chuva intensa',
  82: 'Chuva muito intensa', 85: 'Neve leve', 86: 'Neve forte', 95: 'Trovoada',
  96: 'Trovoada com granizo', 99: 'Trovoada com granizo forte',
};

const API_URL = '/api/compromissos';

// Hook que anima o número uma vez, sem piscar
function useCountUp(valorFinal, duracao = 2000) {
  const [valor, setValor] = useState(0);
  const prevRef = useRef(0);
  const isFirstLoad = useRef(true);
  
  useEffect(() => {
    if (valorFinal == null) return;
    
    // Na primeira carga anima de 0 até o valor
    // Nas próximas atualizações (10 em 10s) só atualiza o número sem animação brusca
    if (isFirstLoad.current) {
      const start = 0;
      const diff = valorFinal - start;
      const startTime = Date.now();
      let raf;
      const animar = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(elapsed / duracao, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setValor(start + diff * ease);
        if (p < 1) raf = requestAnimationFrame(animar);
        else { 
          setValor(valorFinal); 
          prevRef.current = valorFinal;
          isFirstLoad.current = false;
        }
      };
      raf = requestAnimationFrame(animar);
      return () => cancelAnimationFrame(raf);
    } else {
      // Atualizações de 10 em 10s - transição suave, sem piscar
      const start = prevRef.current;
      const diff = valorFinal - start;
      const startTime = Date.now();
      let raf;
      const animar = () => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(elapsed / 800, 1); // transição mais rápida e suave
        setValor(start + diff * p);
        if (p < 1) raf = requestAnimationFrame(animar);
        else { 
          setValor(valorFinal); 
          prevRef.current = valorFinal;
        }
      };
      raf = requestAnimationFrame(animar);
      return () => cancelAnimationFrame(raf);
    }
  }, [valorFinal, duracao]);
  
  return valor;
}

function IndicadorItem({ indicador }) {
  const valorAnimado = useCountUp(indicador.valor, 2000);
  
  const formatar = () => {
    if (indicador.id === 'temp') return `${valorAnimado.toFixed(2)}`;
    if (indicador.id === 'co2') return `${valorAnimado.toFixed(4)}`; // 4 casas para ver mudança a cada 10s
    if (indicador.id === 'floresta') return `${valorAnimado.toFixed(4)}`; // 4 casas para ver mudança
    if (indicador.id === 'meta') return `${Math.round(valorAnimado)}`;
    return valorAnimado.toFixed(1);
  };
  
  return (
    <div className="col-md-3">
      <div className="info-card">
        <h2 className="contador" data-target={indicador.valor}>{formatar()}</h2>
        <p>{indicador.texto}</p>
      </div>
    </div>
  );
}

function App() {
  const [formData, setFormData] = useState({ nome: '', cidade: '', compromisso: '' });
  const [mensagem, setMensagem] = useState('');
  const [cidadeClima, setCidadeClima] = useState('');
  const [clima, setClima] = useState(null);
  const [loadingClima, setLoadingClima] = useState(false);
  const [compromissos, setCompromissos] = useState([]);

  const [indicadores, setIndicadores] = useState([
    { id: 'temp', valor: 0, texto: 'Aumento médio da temperatura global.' },
    { id: 'co2', valor: 0, texto: 'Bilhões de toneladas de CO₂ emitidas por ano.' },
    { id: 'floresta', valor: 0, texto: 'Milhões de hectares de florestas perdidos anualmente.' },
    { id: 'meta', valor: 0, texto: 'Meta global de neutralidade de carbono.' },
  ]);

  useEffect(() => {
    const carregarCompromissos = async () => {
      try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error('Não foi possível carregar os compromissos.');
        const dados = await resposta.json();
        setCompromissos(dados);
      } catch (error) { console.error(error); }
    };
    carregarCompromissos();
  }, []);

  useEffect(() => {
    const buscarReais = async () => {
      try {
        let temp = 1.47;
        let co2 = 37.4;
        
        try {
          const r = await fetch('/api/indicadores');
          if (r.ok) {
            const d = await r.json();
            temp = d.temperatura;
            co2 = d.co2_bilhoes;
          }
        } catch {}

        setIndicadores([
          { id: 'temp', valor: temp, texto: 'Aumento médio da temperatura global.' },
          { id: 'co2', valor: co2, texto: 'Bilhões de toneladas de CO₂ emitidas por ano.' },
          { id: 'floresta', valor: 10.2, texto: 'Milhões de hectares de florestas perdidos anualmente.' },
          { id: 'meta', valor: 2050, texto: 'Meta global de neutralidade de carbono.' },
        ]);
      } catch {
        setIndicadores([
          { id: 'temp', valor: 1.47, texto: 'Aumento médio da temperatura global.' },
          { id: 'co2', valor: 37.4, texto: 'Bilhões de toneladas de CO₂ emitidas por ano.' },
          { id: 'floresta', valor: 10.2, texto: 'Milhões de hectares de florestas perdidos anualmente.' },
          { id: 'meta', valor: 2050, texto: 'Meta global de neutralidade de carbono.' },
        ]);
      }
    };

    buscarReais();

    // --- ALTERAÇÃO PEDIDA: atualiza de 10 em 10 segundos SÓ CO2 e FLORESTA ---
    const interval10s = setInterval(() => {
      setIndicadores(prev => prev.map(item => {
        if (item.id === 'co2') {
          // 37.4B por ano = 0.00001185B a cada 10 segundos (11.850 toneladas)
          return { ...item, valor: +(item.valor + 0.00001185).toFixed(7) };
        }
        if (item.id === 'floresta') {
          // 10.2M ha por ano = 0.00000323M a cada 10 segundos (3.23 ha)
          return { ...item, valor: +(item.valor + 0.00000323).toFixed(8) };
        }
        // temp e meta permanecem estáticos (valor real oficial)
        return item;
      }));
    }, 10000); // 10 segundos

    return () => clearInterval(interval10s);
  }, []);

  const totalCompromissos = useMemo(() => compromissos.length, [compromissos]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nome = formData.nome.trim();
    const cidade = formData.cidade.trim();
    const compromisso = formData.compromisso.trim();
    if (!nome || !cidade || !compromisso) {
      setMensagem('Preencha todos os campos para confirmar seu compromisso.');
      return;
    }
    try {
      const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cidade, compromisso }),
      });
      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.message || 'Erro ao salvar compromisso.');
      }
      const novoCompromisso = await resposta.json();
      setCompromissos((prev) => [novoCompromisso, ...prev]);
      setMensagem(`Obrigado, ${nome}! Você se comprometeu a ${compromisso.toLowerCase()} em ${cidade}. 🌱`);
      setFormData({ nome: '', cidade: '', compromisso: '' });
    } catch (error) {
      setMensagem(error.message || 'Não foi possível registrar o compromisso.');
    }
  };

  const buscarClima = async () => {
    const cidade = cidadeClima.trim();
    if (!cidade) { setClima({ erro: 'Digite o nome de uma cidade antes de buscar.' }); return; }
    setLoadingClima(true); setClima(null);
    try {
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
      const geocodeResponse = await fetch(geocodeUrl);
      if (!geocodeResponse.ok) throw new Error('Cidade não encontrada.');
      const geocodeData = await geocodeResponse.json();
      if (!geocodeData.results || geocodeData.results.length === 0) throw new Error('Cidade não encontrada.');
      const { latitude, longitude, name, country, timezone } = geocodeData.results[0];
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=${encodeURIComponent(timezone)}`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) throw new Error('Não foi possível obter os dados climáticos.');
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      const weatherLabel = weatherCodes[current.weather_code] || 'Condição variada';
      setClima({ name, country, temperatura: current.temperature_2m, sensacao: current.apparent_temperature, umidade: current.relative_humidity_2m, condicao: weatherLabel, timezone });
    } catch (error) { setClima({ erro: error.message || 'Erro ao consultar o clima.' }); }
    finally { setLoadingClima(false); }
  };

  const handleKeyDown = (event) => { if (event.key === 'Enter') buscarClima(); };

  return (
    <>
      <header>
        <nav className="navbar navbar-expand-lg navbar-dark bg-success fixed-top shadow">
          <div className="container">
            <a className="navbar-brand fw-bold" href="#inicio">🌎 ODS 13</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu" aria-controls="menu" aria-expanded="false" aria-label="Abrir menu"><span className="navbar-toggler-icon" /></button>
            <div className="collapse navbar-collapse" id="menu">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item"><a className="nav-link" href="#sobre">Sobre</a></li>
                <li className="nav-item"><a className="nav-link" href="#causas">Causas</a></li>
                <li className="nav-item"><a className="nav-link" href="#impactos">Impactos</a></li>
                <li className="nav-item"><a className="nav-link" href="#acoes">Soluções</a></li>
                <li className="nav-item"><a className="nav-link" href="#clima">Clima</a></li>
                <li className="nav-item"><a className="nav-link" href="#compromisso">Compromisso</a></li>
              </ul>
            </div>
          </div>
        </nav>
        <section id="inicio" className="hero d-flex align-items-center text-white">
          <div className="container text-center">
            <h1 className="display-4 fw-bold">ODS 13 — Ação Contra a Mudança Global do Clima</h1>
            <p className="lead mt-3">Tomar medidas urgentes para combater a mudança climática e seus impactos.</p>
            <a href="#sobre" className="btn btn-light btn-lg m-2">Saiba Mais</a>
            <a href="#compromisso" className="btn btn-outline-light btn-lg">Assuma um Compromisso</a>
          </div>
        </section>
      </header>

      <main>
        <section id="sobre" className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-6"><img src="/assets/img/ods13.png" className="img-fluid rounded shadow" alt="ODS 13" /></div>
            <div className="col-lg-6"><h2>O que é a ODS 13?</h2><p>A ODS 13 integra os Objetivos de Desenvolvimento Sustentável da ONU e busca promover ações para reduzir os impactos das mudanças climáticas.</p><p>A mudança do clima afeta a biodiversidade, a economia, a saúde das pessoas e a qualidade de vida das futuras gerações.</p></div>
          </div>
        </section>

        <section id="causas" className="bg-light py-5">
          <div className="container"><h2 className="text-center mb-5">Principais Causas</h2><div className="row g-4">{causas.map((causa) => (<div key={causa.titulo} className="col-md-3"><div className="card h-100 text-center shadow"><div className="card-body"><h1>{causa.emoji}</h1><h5>{causa.titulo}</h5><p>{causa.texto}</p></div></div></div>))}</div></div>
        </section>

        <section id="impactos" className="container py-5">
          <h2 className="text-center mb-5">Impactos das Mudanças Climáticas</h2>
          <div className="row align-items-center g-4">
            <div className="col-lg-6"><ul className="list-group"><li className="list-group-item">🌊 Enchentes e aumento do nível do mar.</li><li className="list-group-item">☀ Ondas de calor mais intensas.</li><li className="list-group-item">🌾 Secas prolongadas.</li><li className="list-group-item">🌱 Perda de espécies da fauna e flora.</li><li className="list-group-item">🏥 Aumento de doenças relacionadas ao clima.</li></ul></div>
            <div className="col-lg-6"><img src="/assets/impactos.jpg" className="img-fluid rounded shadow" alt="Impactos Climáticos" /></div>
          </div>
        </section>

        <section id="acoes" className="bg-success text-white py-5">
          <div className="container"><h2 className="text-center mb-5">O que podemos fazer?</h2><div className="row g-4">{solucoes.map((solucao) => (<div key={solucao.titulo} className="col-md-4"><div className="card h-100 text-center"><div className="card-body"><h1>{solucao.emoji}</h1><h5>{solucao.titulo}</h5><p>{solucao.texto}</p></div></div></div>))}</div></div>
        </section>

        <section className="container py-5">
          <h2 className="text-center mb-5">Indicadores Ambientais</h2>
          <div className="row text-center g-4">
            {indicadores.map((indicador) => (
              <IndicadorItem key={indicador.id} indicador={indicador} />
            ))}
          </div>
        </section>

        <section id="clima" className="bg-light py-5">
          <div className="container">
            <div className="row align-items-center g-4">
              <div className="col-lg-6">
                <div className="weather-panel">
                  <h2>Confira o clima da sua cidade</h2>
                  <p className="mb-3">Veja a temperatura atual e o estado do tempo em tempo real.</p>
                  <div className="input-group input-group-lg">
                    <input type="text" className="form-control" placeholder="Digite uma cidade" value={cidadeClima} onChange={(event) => setCidadeClima(event.target.value)} onKeyDown={handleKeyDown} />
                    <button className="btn btn-success" type="button" onClick={buscarClima}>Buscar</button>
                  </div>
                  <small className="text-muted d-block mt-2">Dados fornecidos pela API Open-Meteo.</small>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="result-card" aria-live="polite">
                  {loadingClima ? (<><h3>Consultando...</h3><p>Buscando dados climáticos...</p></>) : clima ? (clima.erro ? (<><h3>Erro ao consultar o clima</h3><p>{clima.erro}</p></>) : (<><h3>{clima.name} - {clima.country}</h3><p><strong>{clima.temperatura}°C</strong> | {clima.condicao}</p><div className="result-metrics"><div className="metric-box"><span>Sensação térmica</span><strong>{clima.sensacao}°C</strong></div><div className="metric-box"><span>Umidade</span><strong>{clima.umidade}%</strong></div><div className="metric-box"><span>Fuso</span><strong>{clima.timezone}</strong></div></div></>)) : (<><h3>Previsão atual</h3><p>Informe uma cidade para consultar o clima atual.</p></>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="compromisso" className="py-5">
          <div className="container">
            <h2 className="text-center mb-4">Assuma um Compromisso Ambiental</h2>
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-md-6"><input type="text" className="form-control" name="nome" placeholder="Seu nome" value={formData.nome} onChange={handleChange} required /></div>
              <div className="col-md-6"><input type="text" className="form-control" name="cidade" placeholder="Sua cidade" value={formData.cidade} onChange={handleChange} required /></div>
              <div className="col-12"><select className="form-select" name="compromisso" value={formData.compromisso} onChange={handleChange} required><option value="">Escolha um compromisso</option><option value="Plantar uma árvore.">Plantar uma árvore.</option><option value="Economizar água.">Economizar água.</option><option value="Reduzir uso de plástico.">Reduzir uso de plástico.</option><option value="Reciclar resíduos.">Reciclar resíduos.</option></select></div>
              <div className="col-12 text-center"><button className="btn btn-success btn-lg" type="submit">Quero Participar</button></div>
              {mensagem && (<div className="col-12 text-center"><div className="alert alert-success" role="alert">{mensagem}</div></div>)}
            </form>
            <div className="mt-5 card bg-light border-0 shadow-sm"><div className="card-body"><h3 className="h5 mb-3">Compromissos registrados</h3><div className="d-flex justify-content-between mb-3 flex-wrap gap-2"><span className="badge bg-success rounded-pill fs-6">Total: {totalCompromissos}</span></div>{compromissos.length === 0 ? (<p className="mb-0 text-muted">Nenhum compromisso registrado ainda.</p>) : (<ul className="list-group">{compromissos.map((item) => (<li key={item.id} className="list-group-item d-flex justify-content-between align-items-start gap-3"><div><strong>{item.nome}</strong><div className="text-muted">{item.cidade}</div></div><span className="badge bg-success-subtle text-success-emphasis rounded-pill">{item.compromisso}</span></li>))}</ul>)}</div></div>
          </div>
        </section>
      </main>

      <footer className="bg-dark text-white text-center py-4">
        <p>Projeto acadêmico — Desenvolvimento Web | UEMA</p>
        <p>ODS 13 — Ação contra a Mudança Global do Clima</p>
        <p style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.9 }}>Projeto desenvolvido por:<br />João Juscelino Melo Pereira<br />João Emanuel Vale Gonçalves<br />Eldivan Pereira</p>
      </footer>
    </>
  );
}
export default App;
