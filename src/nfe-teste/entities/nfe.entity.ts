import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StatusNFe {
    RASCUNHO = 'rascunho',
    VALIDADA = 'validada',
    AUTORIZADA = 'autorizada',
    REJEITADA = 'rejeitada',
    CANCELADA = 'cancelada',
    DENEGADA = 'denegada'
}

@Entity('notas_fiscais')
export class NotaFiscal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 44, nullable: true, unique: true })
    chave: string;

    @Column({ type: 'int' })
    serie: number;

    @Column({ type: 'int' })
    numero: number;

    @Column({ type: 'varchar', length: 60 })
    natureza_operacao: string;

    @Column({ type: 'varchar', length: 1 }) // 1=Saída, 0=Entrada
    tipo_nf: string;

    @Column({ type: 'varchar', length: 1 }) // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
    finalidade: string;

    @Column({ type: 'varchar', length: 1 }) // 1=Produção, 2=Homologação
    ambiente: string;

    // Emitente
    @Column({ type: 'varchar', length: 14 })
    emitente_cnpj: string;

    @Column({ type: 'varchar', length: 60 })
    emitente_nome: string;

    @Column({ type: 'varchar', length: 2 })
    emitente_uf: string;

    // Destinatário
    @Column({ type: 'varchar', length: 14 })
    destinatario_cnpj_cpf: string;

    @Column({ type: 'varchar', length: 60 })
    destinatario_nome: string;

    // Valores Totais
    @Column({ type: 'decimal', precision: 13, scale: 2, default: 0 })
    valor_produtos: number;

    @Column({ type: 'decimal', precision: 13, scale: 2, default: 0 })
    valor_total: number;

    @Column({ type: 'decimal', precision: 13, scale: 2, default: 0 })
    valor_icms: number;

    @Column({ type: 'decimal', precision: 13, scale: 2, default: 0 })
    valor_pis: number;

    @Column({ type: 'decimal', precision: 13, scale: 2, default: 0 })
    valor_cofins: number;

    // Controle
    @Column({ 
        type: 'enum', 
        enum: StatusNFe, 
        default: StatusNFe.RASCUNHO 
    })
    status: StatusNFe;

    @Column({ type: 'varchar', length: 50, nullable: true })
    protocolo: string;

    @Column({ type: 'timestamp', nullable: true })
    data_autorizacao: Date;

    @Column({ type: 'text', nullable: true })
    mensagem_sefaz: string;

    @Column({ type: 'int', nullable: true })
    codigo_status_sefaz: number;

    // XML e Dados JSON
    @Column({ type: 'text' })
    xml_original: string;

    @Column({ type: 'text', nullable: true })
    xml_assinado: string;

    @Column({ type: 'jsonb' })
    dados_completos: any; // Armazena o JSON completo enviado

    // Informações complementares
    @Column({ type: 'text', nullable: true })
    informacoes_complementares: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

