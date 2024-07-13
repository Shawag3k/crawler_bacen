# Use uma imagem base oficial do Node.js
FROM node:20-alpine

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie o arquivo package.json e instale as dependências
COPY package.json package-lock.json ./
RUN npm install

# Copie o código-fonte da aplicação
COPY . .

# Compile a aplicação TypeScript
RUN npm run build

# Defina a porta que a aplicação irá expor
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
