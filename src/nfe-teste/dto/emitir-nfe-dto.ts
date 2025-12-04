export class EmitirNFeDto {
    cnpj: string;
    inscricaoEstadual: string;
    razaoSocial: string;
    nomeFantasia: string;
    
    destinatario: {
      cpfCnpj: string;
      nome: string;
      endereco: {
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
      };
    };
    
    itens: Array<{
      codigo: string;
      descricao: string;
      ncm: string;
      cfop: string;
      unidade: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
    }>;
    
    valorTotal: number;
}