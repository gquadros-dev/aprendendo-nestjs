# ⚡ Início Rápido - Sistema NFe

## 🚀 Subir o Sistema (3 comandos)

```bash
# 1. Configure o .env (veja abaixo)

# 2. Suba o PostgreSQL:
docker-compose up -d

# 3. Inicie a aplicação:
yarn start:dev
```

Pronto! Em ~1 minuto tudo estará funcionando! 🎉

## 📝 Criar arquivo .env

Crie `.env` na raiz:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=15151
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nestjs_nfe

# NFe (OBRIGATÓRIO)
PFX_PASSWORD=sua_senha_do_certificado

# Opcional
NODE_ENV=development
PORT=3000
```

## ✅ Endpoints Disponíveis

### **POST** `/api/nfe-teste/criar-assinar-validar`
Cria, assina, valida e salva NFe no banco.

**Body:** Ver `exemplos/nfe-simples-nacional-payload.json`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "chaveAcesso": "42251231749424000187550010000000011234567890",
    "status": "validada",
    "proximoPasso": "POST /api/nfe-teste/envio ..."
  }
}
```

### **POST** `/api/nfe-teste/envio`
Envia NFes para SEFAZ (uma ou várias) e **atualiza automaticamente o status no banco**.

**Body:**
```json
{
  "nfeIds": [1],       // ou [1, 2, 3] para lote
  "sincrono": true
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "message": "✅ Lote com 1 NFe(s) autorizado com sucesso!",
  "data": {
    "nfesEnviadas": [{ "id": 1, "chave": "..." }],
    "retornoSefaz": {
      "Envio": {
        "CStat": "100",
        "NProt": "342251234567890",
        "DhRecbto": "04/12/2025 10:20:40",
        "XMotivo": "Autorizado o uso da NF-e"
      }
    },
    "detalhes": {
      "codigoStatus": "100",
      "protocolo": "342251234567890",
      "dataRecebimento": "04/12/2025 10:20:40",
      "mensagem": "Autorizado o uso da NF-e"
    }
  }
}
```

**Após o envio, o banco é atualizado automaticamente:**
- ✅ `status` → "autorizada" ou "rejeitada"
- ✅ `codigo_status_sefaz` → 100 (autorizada) ou 703 (rejeitada) etc.
- ✅ `protocolo` → Protocolo de autorização da SEFAZ
- ✅ `mensagem_sefaz` → Mensagem de sucesso ou erro
- ✅ `data_autorizacao` → Data/hora do recebimento pela SEFAZ

### **GET** `/api/nfe-teste/listar?limite=50`
Lista NFes do banco.

### **GET** `/api/nfe-teste/:id`
Busca NFe específica.

### **GET** `/api/nfe-teste/status`
Verifica status do serviço da SEFAZ.

### **GET** `/api/nfe-teste/consultar/:chave`
Consulta NFe na SEFAZ pela chave.

### **POST** `/api/nfe-teste/cancelar`
Cancela uma NFe autorizada.

**Body:**
```json
{
  "chave": "42251231749424000187550010000000011234567890",
  "justificativa": "Cancelamento de teste (minimo 15 caracteres)",
  "cnpj": "31749424000187"
}
```

### **POST** `/api/nfe-teste/gerar-pdf`
Gera PDF da última NFe processada.

## 🧪 Exemplo Completo de Teste

```bash
# 1. Status da SEFAZ
curl http://localhost:3000/api/nfe-teste/status

# 2. Criar NFe (use o JSON de exemplos/nfe-simples-nacional-payload.json)
curl -X POST http://localhost:3000/api/nfe-teste/criar-assinar-validar \
  -H "Content-Type: application/json" \
  -d @exemplos/nfe-simples-nacional-payload.json

# Resposta: { "data": { "id": 1, ... } }

# 3. Enviar para SEFAZ
curl -X POST http://localhost:3000/api/nfe-teste/envio \
  -H "Content-Type: application/json" \
  -d '{"nfeIds": [1], "sincrono": true}'

# 4. Listar NFes
curl http://localhost:3000/api/nfe-teste/listar
```

## 🗄️ Acessar o Banco

```
Host: localhost
Port: 15151
User: postgres
Password: postgres
Database: nestjs_nfe
```

## 📂 Estrutura de Pastas

```
data/
├── cert/           # Certificado .pfx AQUI
├── config/         # acbrlib.ini
├── notas/          # XMLs gerados
├── pdf/            # PDFs gerados
└── log/            # Logs do ACBr
```

## 🛑 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f app

# Parar containers
docker-compose down

# Rebuild completo
docker-compose up --build --force-recreate

# Limpar tudo (CUIDADO: apaga os dados)
docker-compose down -v
```

## 🐛 Solução de Problemas

### Container não inicia
```bash
docker-compose logs app
```

### Banco não conecta
Verifique se o PostgreSQL está rodando:
```bash
docker-compose ps
```

### ACBr não carrega
- Verifique se as bibliotecas `.so` estão em `lib/`
- Veja os logs: `docker-compose logs app | grep ACBr`

## 📞 Mais Informações

- **Setup detalhado:** Ver `README-SETUP.md`
- **Exemplos de payload:** Ver pasta `exemplos/`
- **Documentação NFe:** Ver `exemplos/README-TESTE-NFE.md`

