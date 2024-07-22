# Use uma imagem oficial do Node.js como imagem base
FROM node:20

# Configure o diretório de trabalho dentro do container
WORKDIR /app

# Copie o arquivo package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Adicione a instalação dos navegadores do Playwright
RUN npx playwright install --with-deps

# Copie o restante do código-fonte da aplicação para o diretório de trabalho
COPY . .

# Compile o código TypeScript para JavaScript
RUN npm run build

# Exponha a porta em que o aplicativo vai rodar
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "build/index.js"]
