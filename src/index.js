const express = require('express');
const path = require('path');
const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const frases = require("./frases");
const puppeteer = require('puppeteer');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Rota para a página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Configuração do cliente do WhatsApp com Puppeteer
const client = new Client({
    puppeteer: {
        headless: true, // Mantenha true para não abrir uma janela do Chrome
        executablePath: '/usr/bin/google-chrome', // Ajuste o caminho para o executável do Chrome no seu contêiner
        args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox']
    }
});

// Criação do servidor WebSocket
const wss = new WebSocket.Server({ noServer: true });

let currentQrCodeUrl = ''; // Armazena a URL do QR Code atual

client.on("qr", (qr) => {
    console.log("QR Code gerado");
    qrcode.generate(qr, { small: true }); // Gera QR Code no terminal
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=400x400`;

    // Verifica se a URL do QR Code mudou
    if (currentQrCodeUrl !== qrCodeUrl) {
        currentQrCodeUrl = qrCodeUrl; // Atualiza a URL do QR Code atual

        console.log(`QR Code URL: ${qrCodeUrl}`);
        
        // Envia a URL do QR Code para todos os clientes conectados
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(qrCodeUrl);
            }
        });
    }
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
        }, 60000); // Pausa de 60 segundos
        return;
    } else if (userMessage === "2") {
        client.sendMessage(message.from, frases.Informacoes + frases.VoltarAoMenu);
        setTimeout(() => {
            client.sendMessage(message.from, frases.Finalizarconversa + frases.PausaFinalizarConversa);
            conversationsEnded.add(message.from);
        }, 60000); // Pausa de 60 segundos
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

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Tratamento de upgrade para WebSocket
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('Cliente conectado ao WebSocket');

        // Se houver um QR Code atual, envia para o novo cliente
        if (currentQrCodeUrl) {
            ws.send(currentQrCodeUrl);
        }

        wss.emit('connection', ws, request);
    });
});
