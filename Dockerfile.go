# Use uma imagem base do Golang
FROM golang:1.20-alpine

# Configure o diretório de trabalho dentro do container
WORKDIR /app

# Copie os arquivos go.mod e go.sum e baixe as dependências
COPY go.mod go.sum ./
RUN go mod download

# Copie o código-fonte da aplicação
COPY . .

# Compile a aplicação
RUN go build -o main ./cmd/api

# Defina a porta que a aplicação irá expor
EXPOSE 8080

# Comando para rodar a aplicação
CMD ["./main"]
