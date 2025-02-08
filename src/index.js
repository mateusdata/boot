const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Configuração do cliente do WhatsApp com Puppeteer
const client = new Client({
  puppeteer: {
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-gpu", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("Cliente do WhatsApp está pronto!");
  const phoneNumbers = [
    "557197108255@c.us",
    "5577998393262@c.us",
  ];
  async function sendMessages() {
    for (const number of phoneNumbers) {
      const messageText = `
        Olá [cliente], Já têm [dias] dias que você 
        fez [serviço] aqui. Que tal aproveitar e marcar sua hora? 
        Equipe Centro de Beleza e Estética Gel Tarrão. 
        https://www.trinks.com/salao-gel
      `;

      try {
        await client.sendMessage(number, messageText);
        console.log(`Mensagem enviada para ${number}`);
      } catch (err) {
        console.error(`Erro ao enviar para ${number}:`, err);
      }


      const delay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
      console.log(`Aguardando ${delay / 1000} segundos antes do próximo envio...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    console.log("Todas as mensagens foram enviadas!");
  }

  sendMessages();
});

client.initialize();
