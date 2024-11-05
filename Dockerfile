# Use a imagem base do Node.js
FROM node:16

# Instale dependências do sistema necessárias para o Puppeteer e o Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    x11-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Adicione o repositório do Google Chrome e instale o Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && apt-get install -y \
    google-chrome-stable \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Crie o diretório de trabalho
WORKDIR /app

# Copie o package.json e o package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do projetos
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Comando para rodar sua aplicação
CMD ["npm", "start"]

# Exponha a porta (caso necessário)
EXPOSE 3000
