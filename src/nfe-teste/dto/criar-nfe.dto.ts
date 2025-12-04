export class EnderecoDto {
    xLgr: string;      // Logradouro
    nro: string;       // Número
    xCpl?: string;     // Complemento
    xBairro: string;   // Bairro
    cMun: string;      // Código do município (IBGE)
    xMun: string;      // Nome do município
    UF: string;        // UF
    CEP: string;       // CEP
    cPais?: string;    // Código do país (padrão: 1058 - Brasil)
    xPais?: string;    // Nome do país (padrão: Brasil)
    fone?: string;     // Telefone
}

export class EmitenteDto {
    CNPJ: string;
    xNome: string;        // Razão Social
    xFant?: string;       // Nome Fantasia
    endereco: EnderecoDto;
    IE: string;           // Inscrição Estadual
    CRT: '1' | '2' | '3'; // Regime Tributário (1=Simples, 2=Normal, 3=Presumido)
}

export class DestinatarioDto {
    CNPJ?: string;
    CPF?: string;
    xNome: string;
    endereco: EnderecoDto;
    indIEDest: '1' | '2' | '9'; // 1=Contribuinte, 2=Isento, 9=Não Contribuinte
    IE?: string;
    email?: string;
}

export class ICMSDto {
    orig: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'; // Origem da mercadoria
    CST?: string;     // 00, 10, 20, 30, 40, 41, 50, 51, 60, 70, 90 (Regime Normal)
    CSOSN?: string;   // 101, 102, 103, 201, 202, 203, 300, 400, 500, 900 (Simples Nacional)
    modBC?: string;   // Modalidade de determinação da BC
    vBC?: number;     // Valor da BC do ICMS
    pICMS?: number;   // Alíquota do ICMS
    vICMS?: number;   // Valor do ICMS
    pCredSN?: number; // Alíquota de crédito do Simples Nacional
    vCredICMSSN?: number; // Valor de crédito do ICMS Simples Nacional
}

export class PISDto {
    CST: string;     // Código de Situação Tributária
    vBC?: number;    // Valor da BC do PIS
    pPIS?: number;   // Alíquota do PIS
    vPIS?: number;   // Valor do PIS
}

export class COFINSDto {
    CST: string;     // Código de Situação Tributária
    vBC?: number;    // Valor da BC da COFINS
    pCOFINS?: number; // Alíquota da COFINS
    vCOFINS?: number; // Valor da COFINS
}

export class ImpostoDto {
    ICMS: ICMSDto;
    PIS: PISDto;
    COFINS: COFINSDto;
}

export class ProdutoDto {
    cProd: string;        // Código do produto
    cEAN?: string;        // Código de barras GTIN (padrão: SEM GTIN)
    xProd: string;        // Descrição do produto
    NCM: string;          // Código NCM
    CFOP: string;         // Código Fiscal de Operações
    uCom: string;         // Unidade Comercial
    qCom: number;         // Quantidade Comercial
    vUnCom: number;       // Valor Unitário Comercial
    vProd: number;        // Valor Total Bruto dos Produtos
    cEANTrib?: string;    // Código de barras tributável (padrão: SEM GTIN)
    uTrib?: string;       // Unidade Tributável
    qTrib?: number;       // Quantidade Tributável
    vUnTrib?: number;     // Valor Unitário Tributável
    indTot?: '0' | '1';   // 0=não compõe total, 1=compõe total (padrão: 1)
    imposto: ImpostoDto;
}

export class PagamentoDto {
    indPag?: '0' | '1';             // 0=Pagamento à Vista, 1=Pagamento à Prazo
    tPag: '01' | '02' | '03' | '04' | '05' | '10' | '11' | '12' | '13' | '14' | '15' | '90' | '99';
    // 01=Dinheiro, 02=Cheque, 03=Cartão de Crédito, 04=Cartão de Débito, 05=Crédito Loja,
    // 10=Vale Alimentação, 11=Vale Refeição, 12=Vale Presente, 13=Vale Combustível,
    // 14=Duplicata Mercantil, 15=Boleto Bancário, 90=Sem Pagamento, 99=Outros
    vPag: number;                    // Valor do Pagamento
}

export class TransporteDto {
    modFrete: '0' | '1' | '2' | '3' | '4' | '9'; 
    // 0=Por conta do Emitente, 1=Por conta do Destinatário, 2=Por conta de Terceiros,
    // 3=Transporte Próprio por conta do Remetente, 4=Transporte Próprio por conta do Destinatário,
    // 9=Sem Transporte
}

export class CriarNfeDto {
    // Identificação
    naturezaOperacao: string;
    serie: number;
    numero: number;
    dataEmissao?: string;            // ISO 8601 (padrão: data/hora atual)
    tpNF: '0' | '1';                 // 0=Entrada, 1=Saída
    idDest: '1' | '2' | '3';         // 1=Interna, 2=Interestadual, 3=Exterior
    tpAmb?: '1' | '2';               // 1=Produção, 2=Homologação (padrão: 2)
    finNFe: '1' | '2' | '3' | '4';   // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
    indFinal: '0' | '1';             // 0=Normal, 1=Consumidor Final
    indPres: '0' | '1' | '2' | '3' | '4' | '5' | '9';
    // 0=Não se aplica, 1=Presencial, 2=Internet, 3=Teleatendimento, 4=Entrega em domicílio, 
    // 5=Presencial fora do estabelecimento, 9=Operação não presencial

    // Participantes
    emitente: EmitenteDto;
    destinatario: DestinatarioDto;

    // Produtos
    produtos: ProdutoDto[];

    // Transporte
    transporte?: TransporteDto;

    // Pagamento
    pagamentos: PagamentoDto[];

    // Informações Adicionais
    infCpl?: string;                 // Informações Complementares
}

