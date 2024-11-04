const express = require('express');
const path = require('path');
const { Client } = require("whatsapp-web.js");
const frases = require("./frases");
const puppeteer = require('puppeteer');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const term = require('terminal-kit').terminal;

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
        headless: true,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox']
    }
});

// Criação do servidor WebSocket
const wss = new WebSocket.Server({ noServer: true });

let currentQrCodeUrl = '';

// Função para gerar e exibir o QR Code menor no terminal
const generateSmallQRCode = async (qr) => {
    try {
        const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
        term(qrString); // Exibe o QR Code no terminal de forma compacta
    } catch (error) {
        console.error('Erro ao gerar o QR Code:', error);
    }
};

client.on("qr", (qr) => {
    console.log("QR Code gerado");
    generateSmallQRCode(qr); // Gera QR Code menor no terminal

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=100x100`;

    if (currentQrCodeUrl !== qrCodeUrl) {
        currentQrCodeUrl = qrCodeUrl;
        console.log(`QR Code URL: ${qrCodeUrl}`);
        
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

    if (userMessage === "0") {
        client.sendMessage(message.from, frases.Menu + frases.VoltarAoMenu);
    } else if (userMessage === "1") {
        client.sendMessage(message.from, frases.Agendamento + frases.VoltarAoMenu);
        setTimeout(() => {
            client.sendMessage(message.from, frases.Finalizarconversa + frases.PausaFinalizarConversa);
            conversationsEnded.add(message.from);
        }, 60000);
    } else if (userMessage === "2") {
        client.sendMessage(message.from, frases.Informacoes + frases.VoltarAoMenu);
        setTimeout(() => {
            client.sendMessage(message.from, frases.Finalizarconversa + frases.PausaFinalizarConversa);
            conversationsEnded.add(message.from);
        }, 60000);
    } else if (userMessage === "3") {
        client.sendMessage(message.from, frases.PortfolioServicos + frases.VoltarAoMenu);
    } else if (userMessage === "fim") {
        conversationsEnded.add(message.from);
        client.sendMessage(message.from, frases.Finalizarconversa + frases.PausaFinalizarConversa);
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

        if (currentQrCodeUrl) {
            ws.send(currentQrCodeUrl);
        }

        wss.emit('connection', ws, request);
    });
});
