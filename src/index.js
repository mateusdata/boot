// index.js
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const frases = require("./frases");
const puppeteer = require('puppeteer');

// Configuração do cliente do WhatsApp com Puppeteer
const client = new Client({
    puppeteer: {
        headless: true, // Mantenha true para não abrir uma janela do Chrome
        executablePath: '/usr/bin/google-chrome', // Ajuste o caminho para o executável do Chrome no seu contêiner
        args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox']
    }
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

const greetedUsers = new Set();
const conversationsEnded = new Set();

client.on("message", (message) => {
  if (message.isGroupMsg) return;

  const userMessage = message.body.trim().toLowerCase();

  if (conversationsEnded.has(message.from)) {
    client.sendMessage(message.from, frases.Finalizarconversaaceitou);
    return;
  }

  if (!greetedUsers.has(message.from)) {
    client.sendMessage(message.from, frases.Menu);
    greetedUsers.add(message.from);
  }

  // Resposta ao pressionar "0"
  if (userMessage === "0") {
    client.sendMessage(message.from, frases.Menu + frases.VoltarAoMenu);
    return;
  } else if (userMessage === "1") {
    client.sendMessage(message.from, frases.Agendamento + frases.VoltarAoMenu);
    setTimeout(() => {
      client.sendMessage(message.from, frases.Finalizarconversa + frases.PausaFinalizarConversa);
      conversationsEnded.add(message.from);
    }, 10); // Pausa de 60 minutos
    return;
  } else if (userMessage === "2") {
    client.sendMessage(message.from, frases.Informacoes + frases.VoltarAoMenu);
    setTimeout(() => {
      client.sendMessage(message.from, frases.Finalizarconversa + frases.PausaFinalizarConversa);
      conversationsEnded.add(message.from);
    }, 10); // Pausa de 60 minutos
    return;
  } else if (userMessage === "3") {
    client.sendMessage(message.from, frases.PortfolioServicos + frases.VoltarAoMenu);
    return;
  } else if (userMessage === "fim") {
    conversationsEnded.add(message.from);
    client.sendMessage(message.from, frases.Finalizarconversa + frases.PausaFinalizarConversa);
    return;
  }
});

client.initialize();





