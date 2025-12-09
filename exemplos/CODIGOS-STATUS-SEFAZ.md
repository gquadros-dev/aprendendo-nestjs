# 📊 Códigos de Status da SEFAZ (CStat)

## ✅ Códigos de Sucesso

| Código | Descrição | Ação |
|--------|-----------|------|
| **100** | Autorizado o uso da NF-e | NFe autorizada com sucesso |
| **101** | Cancelamento homologado | Cancelamento autorizado |
| **135** | Evento registrado e vinculado a NF-e | Carta de Correção registrada |
| **150** | Autorizado fora de prazo | Autorizada mas com atraso |

## ❌ Códigos de Rejeição Comuns

| Código | Descrição | Solução |
|--------|-----------|---------|
| **203** | Rejeição: Emissor não habilitado para emissão da NF-e | Verificar cadastro na SEFAZ |
| **204** | Rejeição: Duplicidade de NF-e | Numeração já foi utilizada |
| **213** | CNPJ-Base do Emitente difere do CNPJ-Base do Certificado Digital | Certificado não pertence ao emitente |
| **214** | Tamanho da mensagem excedeu o limite | Reduzir informações complementares |
| **215** | Rejeição: Falha no schema XML | XML mal formado |
| **227** | A Chave de Acesso difere da existente em BD | Chave já existe com dados diferentes |
| **247** | Sigla da UF do Emitente diverge da UF autorizadora | UF incorreta no XML |
| **248** | UF do Recibo diverge da UF autorizadora | Recibo de outra UF |
| **272** | Certificado Transmissor inválido | Certificado vencido ou inválido |
| **280** | A Chave de Acesso da NF-e está duplicada | Já existe NFe com esta chave |
| **301** | Uso Denegado: Irregularidade fiscal do emitente | Problema fiscal com emitente |
| **302** | Uso Denegado: Irregularidade fiscal do destinatário | Problema fiscal com destinatário |
| **539** | CNPJ do destinatário inválido | Validar CNPJ do destinatário |
| **565** | Valor total da NF-e superior ao permitido | Valor muito alto |
| **703** | Data-Hora de Emissão posterior ao horário de recebimento | Ajustar horário do servidor |
| **972** | Obrigatório as informações do responsável técnico | Falta tag infRespTec |
| **999** | Erro não catalogado | Ver mensagem detalhada no XMotivo |

## 📋 Status no Banco de Dados

O sistema mapeia automaticamente:

```typescript
codigo_status_sefaz | status         | Descrição
--------------------|----------------|------------------
999                 | validada       | Criada, aguardando envio
100                 | autorizada     | Autorizada pela SEFAZ
150                 | autorizada     | Autorizada fora de prazo
101                 | cancelada      | Cancelada com sucesso
203-999             | rejeitada      | Rejeitada pela SEFAZ
301-302             | denegada       | Uso denegado
```

## 🔍 Como Verificar o Status

### Listar NFes com Status:

```bash
GET http://localhost:3000/api/nfe-teste/listar
```

**Resposta:**
```json
{
  "success": true,
  "total": 3,
  "data": [
    {
      "id": 3,
      "chave": "42251231749424000187550010000000031234567890",
      "serie": 1,
      "numero": 3,
      "valor": 100,
      "status": "autorizada",
      "codigoStatusSefaz": 100,
      "protocolo": "342251234567890",
      "mensagemSefaz": "Autorizada com sucesso: Autorizado o uso da NF-e",
      "dataAutorizacao": "2025-12-04T10:20:40.000Z"
    },
    {
      "id": 2,
      "status": "rejeitada",
      "codigoStatusSefaz": 703,
      "mensagemSefaz": "Rejeitada pela SEFAZ: Data-Hora posterior..."
    },
    {
      "id": 1,
      "status": "validada",
      "codigoStatusSefaz": 999,
      "mensagemSefaz": "NFe validada, aguardando envio para SEFAZ"
    }
  ]
}
```

### Buscar NFe Específica:

```bash
GET http://localhost:3000/api/nfe-teste/1
```

Retorna todos os detalhes incluindo XMLs, dados completos, histórico, etc.

## 📞 Links Úteis

- [Manual de Orientação NFe](http://www.nfe.fazenda.gov.br/portal/principal.aspx)
- [Tabela Completa de Códigos](http://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=mxgbGa8QL1s=)
- [ACBr Documentação](https://acbr.sourceforge.io/)


