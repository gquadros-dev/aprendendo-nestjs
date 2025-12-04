# 🚀 Guia de Teste - Criação e Envio de NFe

## 📋 Fluxo Completo

### **Opção 1: Criar, Assinar, Validar e Enviar (Passo a Passo)**

#### 1️⃣ Criar NFe
```bash
POST http://localhost:3000/api/nfe-teste/criar
Content-Type: application/json

# Use o payload do arquivo: nfe-exemplo-payload.json
```

**Resposta:**
```json
{
  "success": true,
  "message": "NFe criada com sucesso",
  "data": {
    "iniPath": "C:\\Repos\\aprendendo_nestjs\\data\\notas\\nfe-1733321234567.ini",
    "xml": "<?xml version=\"1.0\"...>"
  }
}
```

#### 2️⃣ Assinar NFe
```bash
POST http://localhost:3000/api/nfe-teste/assinar
```

**Resposta:**
```json
{
  "success": true,
  "message": "NFe assinada com sucesso"
}
```

#### 3️⃣ Validar NFe
```bash
POST http://localhost:3000/api/nfe-teste/validar
```

**Resposta:**
```json
{
  "success": true,
  "message": "NFe validada com sucesso"
}
```

#### 4️⃣ Enviar NFe
```bash
POST http://localhost:3000/api/nfe-teste/enviar
Content-Type: application/json

{
  "lote": 1,
  "imprimir": false,
  "sincrono": true
}
```

**Resposta:**
```json
{
  "success": true,
  "data": "[Protocolo]..."
}
```

---

### **Opção 2: Criar, Assinar e Validar em Uma Chamada** ⚡

```bash
POST http://localhost:3000/api/nfe-teste/criar-assinar-validar
Content-Type: application/json

# Use o payload do arquivo: nfe-exemplo-payload.json
```

**Resposta:**
```json
{
  "success": true,
  "message": "NFe criada, assinada e validada com sucesso",
  "data": {
    "xml": "<?xml version=\"1.0\"...>"
  }
}
```

Depois, basta enviar:
```bash
POST http://localhost:3000/api/nfe-teste/enviar
Content-Type: application/json

{
  "lote": 1,
  "imprimir": false,
  "sincrono": true
}
```

---

## 📦 Exemplo de Payload (nfe-exemplo-payload.json)

```json
{
  "naturezaOperacao": "Venda de Mercadoria",
  "serie": 1,
  "numero": 1,
  "tpNF": "1",
  "idDest": "1",
  "tpAmb": "2",
  "finNFe": "1",
  "indFinal": "0",
  "indPres": "1",
  "emitente": { ... },
  "destinatario": { ... },
  "produtos": [ ... ],
  "pagamentos": [ ... ]
}
```

Ver arquivo completo em: `exemplos/nfe-exemplo-payload.json`

---

## 🔧 Outros Endpoints Úteis

### Verificar Status da SEFAZ
```bash
GET http://localhost:3000/api/nfe-teste/status
```

### Consultar NFe por Chave
```bash
GET http://localhost:3000/api/nfe-teste/consultar/35241012345678000190550010000000011000000011
```

### Gerar PDF da NFe
```bash
POST http://localhost:3000/api/nfe-teste/gerar-pdf
```

---

## ⚠️ Observações Importantes

1. **Ambiente de Homologação**: Por padrão, usa `tpAmb: "2"` (homologação). Para produção, use `"1"`.

2. **Certificado Digital**: Certifique-se de que o certificado está configurado em:
   - Arquivo: `data/cert/cert.pfx`
   - Senha configurada em `.env` como `PFX_PASSWORD`

3. **Dados Válidos**: Use dados reais do seu CNPJ/IE para homologação ou produção.

4. **Numeração**: Mantenha controle da numeração das NFes (série e número).

5. **NCM e CFOP**: Use códigos válidos para seus produtos.

---

## 🐛 Solução de Problemas

### Erro: "Chave inválida"
- Verifique se o dígito verificador está correto
- Confirme os dados da identificação

### Erro: "Certificado inválido"
- Verifique a senha do certificado
- Confirme a validade do certificado

### Erro: "Rejeição da SEFAZ"
- Verifique os logs para ver o código de rejeição
- Consulte a tabela de rejeições da SEFAZ

---

## 📞 Suporte

Para mais informações, consulte:
- [Documentação ACBr](https://acbr.sourceforge.io/)
- [Manual NFe 4.0](http://www.nfe.fazenda.gov.br/portal/principal.aspx)

