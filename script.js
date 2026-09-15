const formCompromisso = document.getElementById('formCompromisso');
const mensagemCompromisso = document.getElementById('mensagemCompromisso');
const btnClima = document.getElementById('btnClima');
const cidadeClima = document.getElementById('cidadeClima');
const resultadoClima = document.getElementById('resultadoClima');

const weatherCodes = {
    0: 'Céu limpo',
    1: 'Parcialmente nublado',
    2: 'Parcialmente nublado',
    3: 'Encoberto',
    45: 'Neblina',
    48: 'Geada',
    51: 'Chuvisco leve',
    53: 'Chuvisco',
    55: 'Chuvisco forte',
    56: 'Chuvisco gelado',
    57: 'Chuvisco gelado forte',
    61: 'Chuva leve',
    63: 'Chuva',
    65: 'Chuva forte',
    66: 'Chuva gelada',
    67: 'Chuva gelada forte',
    71: 'Neve leve',
    73: 'Neve',
    75: 'Neve forte',
    77: 'Granizo',
    80: 'Pancadas de chuva',
    81: 'Chuva intensa',
    82: 'Chuva muito intensa',
    85: 'Neve leve',
    86: 'Neve forte',
    95: 'Trovoada',
    96: 'Trovoada com granizo',
    99: 'Trovoada com granizo forte'
};

function mostrarMensagem(texto) {
    mensagemCompromisso.textContent = texto;
    mensagemCompromisso.classList.remove('d-none');
}

formCompromisso.addEventListener('submit', (event) => {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const compromisso = document.getElementById('compromissoSelect').value;

    if (!nome || !cidade || !compromisso) {
        mostrarMensagem('Preencha todos os campos para confirmar seu compromisso.');
        return;
    }

    mostrarMensagem(`Obrigado, ${nome}! Você se comprometeu a ${compromisso.toLowerCase()} em ${cidade}. 🌱`);
    formCompromisso.reset();
});

function atualizarContador(elemento) {
    const target = Number(elemento.dataset.target);
    const decimals = target % 1 !== 0 ? 1 : 0;
    let current = 0;
    const increment = target / 80;

    const interval = setInterval(() => {
        current += increment;

        if (current >= target) {
            elemento.textContent = target.toFixed(decimals).replace('.', ',');
            clearInterval(interval);
            return;
        }

        elemento.textContent = current.toFixed(decimals).replace('.', ',');
    }, 25);
}

const counters = document.querySelectorAll('.contador');
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            atualizarContador(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach((counter) => observer.observe(counter));

async function buscarClima() {
    const cidade = cidadeClima.value.trim();

    if (!cidade) {
        resultadoClima.innerHTML = '<h3>Erro</h3><p>Digite o nome de uma cidade antes de buscar.</p>';
        return;
    }

    resultadoClima.innerHTML = '<h3>Consultando...</h3><p>Buscando dados climáticos...</p>';

    try {
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
        const geocodeResponse = await fetch(geocodeUrl);

        if (!geocodeResponse.ok) {
            throw new Error('Cidade não encontrada.');
        }

        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.results || geocodeData.results.length === 0) {
            throw new Error('Cidade não encontrada.');
        }

        const { latitude, longitude, name, country, timezone } = geocodeData.results[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=${encodeURIComponent(timezone)}`;
        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error('Não foi possível obter os dados climáticos.');
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;
        const weatherLabel = weatherCodes[current.weather_code] || 'Condição variada';

        resultadoClima.innerHTML = `
            <h3>${name} - ${country}</h3>
            <p><strong>${current.temperature_2m}°C</strong> | ${weatherLabel}</p>
            <div class="result-metrics">
                <div class="metric-box">
                    <span>Sensação térmica</span>
                    <strong>${current.apparent_temperature}°C</strong>
                </div>
                <div class="metric-box">
                    <span>Umidade</span>
                    <strong>${current.relative_humidity_2m}%</strong>
                </div>
                <div class="metric-box">
                    <span>Fuso</span>
                    <strong>${timezone}</strong>
                </div>
            </div>
        `;
    } catch (error) {
        resultadoClima.innerHTML = `
            <h3>Erro ao consultar o clima</h3>
            <p>${error.message}</p>
        `;
    }
}

btnClima.addEventListener('click', buscarClima);
cidadeClima.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        buscarClima();
    }
});