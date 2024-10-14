
build the application:

docker-compose up --build

down the application:

docker-compose down

example:

curl -X POST http://localhost:8080/start-crawl -H "Content-Type: application/json" -d '{
  "tipoDocumento": "Circular",
  "numero": "12345",
  "conteudo": "palavra-chave",
  "dataInicioBusca": "01/01/2020",
  "dataFimBusca": "31/12/2020"
}'
