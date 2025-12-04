import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { CriarNfeDto } from './dto/criar-nfe.dto';

const ACBrLibNFeMT = require('@projetoacbr/acbrlib-nfe-node/dist/src').default;

export interface NFeConfig {
    ambiente: '0' | '1';
    modeloDF: '0' | '1';
    tipoDANFE: '0' | '1' | '2' | '3' | '4' | '5';
}

@Injectable()
export class NfeTesteService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(NfeTesteService.name);
    private acbrNFe: any;
    private readonly pathACBrLib: string;
    private readonly eArqConfig: string;

    constructor(private readonly configService: ConfigService) {
        const libName = os.platform() === 'win32' ? 'ACBrNFe64.dll' : 'libacbrnfe64.so';
        this.pathACBrLib = path.resolve(process.cwd(), 'lib', libName);
        this.eArqConfig = path.resolve(process.cwd(), 'data', 'config', 'acbrlib.ini');
        
        // Adiciona a pasta lib/ ao PATH para o Windows encontrar as DLLs do OpenSSL
        const libPath = path.resolve(process.cwd(), 'lib');
        if (os.platform() === 'win32') {
            process.env.PATH = `${libPath};${process.env.PATH}`;
            this.logger.debug(`PATH atualizado com: ${libPath}`);
        }
    }

    async onModuleInit() {
        try {
          this.logger.log('Inicializando ACBrLibNFe...');
          
          const eChaveCrypt = this.configService.get<string>('ACBR_CRYPT_KEY', '');
          this.acbrNFe = new ACBrLibNFeMT(this.pathACBrLib, this.eArqConfig, eChaveCrypt);
          
          this.acbrNFe.inicializar();
          this.aplicarConfiguracoes();
          
          this.logger.log('ACBrLibNFe inicializado com sucesso!');
        } catch (error) {
          this.logger.error('Erro ao inicializar ACBrLibNFe:', error);
          throw error;
        }
    }

    async onModuleDestroy() {
        try {
          if (this.acbrNFe) {
            this.logger.log('Finalizando ACBrLibNFe...');
            this.acbrNFe.finalizar();
            this.acbrNFe = null;
          }
        } catch (error) {
          this.logger.error('Erro ao finalizar ACBrLibNFe:', error);
        }
    }

    private aplicarConfiguracoes(config?: Partial<NFeConfig>) {
        this.configuraSessaoPrincipal();
        this.configuraSessaoDFe();
        this.configuraSessaoNFe(config);
        this.configuraSessaoDANFE(config);
        this.acbrNFe.configGravar(this.eArqConfig);
    }

    private configuraSessaoPrincipal() {
        const logPath = path.resolve(process.cwd(), 'data', 'log');
        this.acbrNFe.configGravarValor('Principal', 'LogPath', logPath);
        this.acbrNFe.configGravarValor('Principal', 'LogNivel', '4');
    }

    private configuraSessaoDFe() {
        const pfxPath = path.resolve(process.cwd(), 'data', 'cert', 'cert.pfx');
        const senhaPFX = this.configService.get<string>('PFX_PASSWORD');

        if (!senhaPFX) {
          throw new Error('PFX_PASSWORD não configurado no .env');
        }
    
        this.acbrNFe.configGravarValor('DFe', 'SSLCryptLib', '1');
        this.acbrNFe.configGravarValor('DFe', 'SSLHttpLib', '3');
        this.acbrNFe.configGravarValor('DFe', 'SSLXmlSignLib', '4');
        
        this.acbrNFe.configGravarValor('DFe', 'ArquivoPFX', pfxPath);
        this.acbrNFe.configGravarValor('DFe', 'Senha', senhaPFX);
    }

    private configuraSessaoNFe(config?: Partial<NFeConfig>) {
        const schemasPath = path.resolve(process.cwd(), 'data', 'Schemas', 'NFe');
        const notasPath = path.resolve(process.cwd(), 'data', 'notas');
    
        this.acbrNFe.configGravarValor('NFE', 'PathSchemas', schemasPath);
        this.acbrNFe.configGravarValor('NFE', 'PathSalvar', notasPath);
        
        // 0 = Produção, 1 = Homologação
        const ambiente = config?.ambiente || this.configService.get('NFE_AMBIENTE', '1');
        this.acbrNFe.configGravarValor('NFE', 'Ambiente', ambiente);
        
        // 0 = NFe, 1 = NFCe
        const modeloDF = config?.modeloDF || '0';
        this.acbrNFe.configGravarValor('NFE', 'ModeloDF', modeloDF);
    }

    private configuraSessaoDANFE(config?: Partial<NFeConfig>) {
        const pdfPath = path.resolve(process.cwd(), 'data', 'pdf');
        this.acbrNFe.configGravarValor('DANFE', 'PathPDF', pdfPath);
        
        // TipoDANFE: 0=tiSemGeracao, 1=tiRetrato, 2=tiPaisagem, 3=tiSimplificado, 4=tiNFCe, 5=tiMsgEletronica
        const tipoDANFE = config?.tipoDANFE || '1';
        this.acbrNFe.configGravarValor('DANFE', 'TipoDANFE', tipoDANFE);
    }

    /**
    * Carrega um XML de NFe
    */
    async carregarXML(xmlPath: string): Promise<void> {
        try {
            this.acbrNFe.carregarXML(xmlPath);
            this.logger.log(`XML carregado: ${xmlPath}`);
        } catch (error) {
            this.logger.error('Erro ao carregar XML:', error);
            throw error;
        }
    }

    /**
    * Assina a NFe
    */
    async assinar(): Promise<void> {
        try {
            this.acbrNFe.assinar();
            this.logger.log('NFe assinada com sucesso');
        } catch (error) {
            this.logger.error('Erro ao assinar NFe:', error);
            throw error;
        }
    }

    /**
    * Valida a NFe
    */
    async validar(): Promise<void> {
        try {
            this.acbrNFe.validar();
            this.logger.log('NFe validada com sucesso');
        } catch (error) {
            this.logger.error('Erro ao validar NFe:', error);
            throw error;
        }
    }

    /**
    * Obtém o XML da NFe
    */
    async obterXml(index: number = 0): Promise<string> {
        try {
            const xml = this.acbrNFe.obterXml(index);
            return xml;
        } catch (error) {
            this.logger.error('Erro ao obter XML:', error);
            throw error;
        }
    }

    /**
    * Envia a NFe para a SEFAZ
    * @param lote - Número do lote (padrão: 1)
    * @param imprimir - Se deve imprimir (padrão: false)
    * @param sincrono - Se deve enviar de forma síncrona (padrão: true)
    * @param zipado - Se deve enviar compactado (padrão: false)
    */
    async enviar(lote?: number, imprimir?: boolean, sincrono?: boolean, zipado?: boolean): Promise<string> {
        try {
            const loteNum = lote || 1;
            const imp = imprimir || false;
            const sync = sincrono !== false; // padrão true
            const zip = zipado || false;
            
            this.logger.log(`Enviando NFe - Lote: ${loteNum}, Síncrono: ${sync}, Zipado: ${zip}`);
            const resultado = this.acbrNFe.enviar(loteNum, imp, sync, zip);
            this.logger.log('NFe enviada com sucesso');
            return resultado;
        } catch (error) {
            this.logger.error('Erro ao enviar NFe:', error);
            throw error;
        }
    }

    /**
    * Consulta o status do serviço da SEFAZ
    */
    async statusServico(): Promise<string> {
        try {
            return this.acbrNFe.statusServico();
        } catch (error) {
            this.logger.error('Erro ao consultar status do serviço:', error);
            throw error;
        }
    }

    /**
    * Consulta uma NFe pela chave
    * @param chaveNFe - Chave de acesso da NFe (44 dígitos)
    * @param extrairEventos - Se true, extrai eventos (cancelamento, carta de correção, etc.)
    */
    async consultar(chaveNFe: string, extrairEventos: boolean = true): Promise<string> {
        try {
            // Validações
            if (!chaveNFe || chaveNFe.trim() === '') {
                throw new Error('Chave de acesso não informada');
            }
            
            const chaveNumeros = chaveNFe.replace(/\D/g, '');
            if (chaveNumeros.length !== 44) {
                throw new Error(`Chave de acesso inválida. Deve ter 44 dígitos. Recebido: ${chaveNumeros.length} dígitos`);
            }
            
            this.logger.log(`Consultando NFe: ${chaveNumeros}`);
            return this.acbrNFe.consultar(chaveNumeros, extrairEventos);
        } catch (error) {
            this.logger.error('Erro ao consultar NFe:', error);
            throw error;
        }
    }

    /**
    * Cancela uma NFe
    */
    async cancelar(
        chaveNFe: string,
        justificativa: string,
        cnpj: string,
        lote?: number,
    ): Promise<string> {
        try {
            return this.acbrNFe.cancelar(chaveNFe, justificativa, cnpj, lote);
        } catch (error) {
            this.logger.error('Erro ao cancelar NFe:', error);
            throw error;
        }
    }

    /**
    * Inutiliza uma numeração de NFe
    */
    async inutilizar(
        cnpj: string,
        justificativa: string,
        ano: number,
        modelo: number,
        serie: number,
        numeroInicial: number,
        numeroFinal: number,
    ): Promise<string> {
        try {
            return this.acbrNFe.inutilizar(
                cnpj,
                justificativa,
                ano,
                modelo,
                serie,
                numeroInicial,
                numeroFinal,
            );
        } catch (error) {
            this.logger.error('Erro ao inutilizar numeração:', error);
            throw error;
        }
    }

    /**
    * Gera o PDF do DANFE
    */
    async imprimirPDF(): Promise<void> {
        try {
            this.acbrNFe.imprimirPDF();
            this.logger.log('PDF gerado com sucesso');
        } catch (error) {
            this.logger.error('Erro ao gerar PDF:', error);
            throw error;
        }
    }

    /**
    * Limpa a lista de NFes
    */
    limpar(): void {
        this.acbrNFe.limparLista();
    }

    /**
    * Mapeia UF para código IBGE
    */
    private obterCodigoUF(uf: string): string {
        const mapUF: { [key: string]: string } = {
            'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29', 'CE': '23',
            'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21', 'MT': '51', 'MS': '50',
            'MG': '31', 'PA': '15', 'PB': '25', 'PR': '41', 'PE': '26', 'PI': '22',
            'RJ': '33', 'RN': '24', 'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42',
            'SP': '35', 'SE': '28', 'TO': '17'
        };
        return mapUF[uf] || '35';
    }

    /**
    * Gera a chave de acesso da NFe
    */
    private gerarChaveAcesso(dados: CriarNfeDto, dataEmissao: Date): string {
        const cUF = this.obterCodigoUF(dados.emitente.endereco.UF);
        const aamm = dataEmissao.toISOString().substring(2, 7).replace('-', '');
        const cnpj = dados.emitente.CNPJ;
        const mod = '55';
        const serie = String(dados.serie).padStart(3, '0');
        const nnf = String(dados.numero).padStart(9, '0');
        const tpEmis = '1';
        const cNF = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
        
        const chave = `${cUF}${aamm}${cnpj}${mod}${serie}${nnf}${tpEmis}${cNF}`;
        
        // Calcula dígito verificador (módulo 11)
        let soma = 0;
        let peso = 2;
        for (let i = chave.length - 1; i >= 0; i--) {
            soma += parseInt(chave[i]) * peso;
            peso = peso === 9 ? 2 : peso + 1;
        }
        const resto = soma % 11;
        const dv = resto < 2 ? 0 : 11 - resto;
        
        return chave + dv;
    }

    /**
    * Formata data para o padrão da SEFAZ (horário de Brasília UTC-3)
    */
    private formatarDataSefaz(data: Date): string {
        // Converte para horário de Brasília (UTC-3)
        const dataUTC = data.getTime();
        const dataBrasilia = new Date(dataUTC - (3 * 60 * 60 * 1000)); // subtrai 3 horas
        
        const ano = dataBrasilia.getUTCFullYear();
        const mes = String(dataBrasilia.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(dataBrasilia.getUTCDate()).padStart(2, '0');
        const hora = String(dataBrasilia.getUTCHours()).padStart(2, '0');
        const minuto = String(dataBrasilia.getUTCMinutes()).padStart(2, '0');
        const segundo = String(dataBrasilia.getUTCSeconds()).padStart(2, '0');
        
        return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}-03:00`;
    }

    /**
    * Converte dados JSON da NFe para XML completo
    */
    private jsonParaXML(dados: CriarNfeDto): string {
        // Data de emissão - subtrai 2 minutos para evitar rejeição por data futura
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - 2);
        const dataEmissao = dados.dataEmissao || this.formatarDataSefaz(agora);
        const tpAmb = dados.tpAmb || '2';
        const chaveAcesso = this.gerarChaveAcesso(dados, agora);
        
        // Calcula totais
        const vProd = dados.produtos.reduce((sum, p) => sum + p.vProd, 0);
        const vICMS = dados.produtos.reduce((sum, p) => sum + (p.imposto.ICMS.vICMS || 0), 0);
        const vBC = dados.produtos.reduce((sum, p) => sum + (p.imposto.ICMS.vBC || 0), 0);
        const vPIS = dados.produtos.reduce((sum, p) => sum + (p.imposto.PIS.vPIS || 0), 0);
        const vCOFINS = dados.produtos.reduce((sum, p) => sum + (p.imposto.COFINS.vCOFINS || 0), 0);
        
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">\n';
        xml += `  <infNFe Id="NFe${chaveAcesso}" versao="4.00">\n`;
        
        // IDE
        xml += '    <ide>\n';
        xml += `      <cUF>${this.obterCodigoUF(dados.emitente.endereco.UF)}</cUF>\n`;
        xml += `      <cNF>${chaveAcesso.substring(35, 43)}</cNF>\n`;
        xml += `      <natOp>${dados.naturezaOperacao}</natOp>\n`;
        xml += '      <mod>55</mod>\n';
        xml += `      <serie>${dados.serie}</serie>\n`;
        xml += `      <nNF>${dados.numero}</nNF>\n`;
        xml += `      <dhEmi>${dataEmissao}</dhEmi>\n`;
        xml += `      <tpNF>${dados.tpNF}</tpNF>\n`;
        xml += `      <idDest>${dados.idDest}</idDest>\n`;
        xml += `      <cMunFG>${dados.emitente.endereco.cMun}</cMunFG>\n`;
        xml += '      <tpImp>1</tpImp>\n';
        xml += '      <tpEmis>1</tpEmis>\n';
        xml += `      <cDV>${chaveAcesso[43]}</cDV>\n`;
        xml += `      <tpAmb>${tpAmb}</tpAmb>\n`;
        xml += `      <finNFe>${dados.finNFe}</finNFe>\n`;
        xml += `      <indFinal>${dados.indFinal}</indFinal>\n`;
        xml += `      <indPres>${dados.indPres}</indPres>\n`;
        xml += '      <procEmi>0</procEmi>\n';
        xml += '      <verProc>1.0</verProc>\n';
        xml += '    </ide>\n';
        
        // EMIT
        xml += '    <emit>\n';
        xml += `      <CNPJ>${dados.emitente.CNPJ}</CNPJ>\n`;
        xml += `      <xNome>${dados.emitente.xNome}</xNome>\n`;
        if (dados.emitente.xFant) xml += `      <xFant>${dados.emitente.xFant}</xFant>\n`;
        xml += '      <enderEmit>\n';
        xml += `        <xLgr>${dados.emitente.endereco.xLgr}</xLgr>\n`;
        xml += `        <nro>${dados.emitente.endereco.nro}</nro>\n`;
        if (dados.emitente.endereco.xCpl) xml += `        <xCpl>${dados.emitente.endereco.xCpl}</xCpl>\n`;
        xml += `        <xBairro>${dados.emitente.endereco.xBairro}</xBairro>\n`;
        xml += `        <cMun>${dados.emitente.endereco.cMun}</cMun>\n`;
        xml += `        <xMun>${dados.emitente.endereco.xMun}</xMun>\n`;
        xml += `        <UF>${dados.emitente.endereco.UF}</UF>\n`;
        xml += `        <CEP>${dados.emitente.endereco.CEP}</CEP>\n`;
        xml += `        <cPais>${dados.emitente.endereco.cPais || '1058'}</cPais>\n`;
        xml += `        <xPais>${dados.emitente.endereco.xPais || 'BRASIL'}</xPais>\n`;
        if (dados.emitente.endereco.fone) xml += `        <fone>${dados.emitente.endereco.fone}</fone>\n`;
        xml += '      </enderEmit>\n';
        xml += `      <IE>${dados.emitente.IE}</IE>\n`;
        xml += `      <CRT>${dados.emitente.CRT}</CRT>\n`;
        xml += '    </emit>\n';
        
        // DEST
        xml += '    <dest>\n';
        if (dados.destinatario.CNPJ) xml += `      <CNPJ>${dados.destinatario.CNPJ}</CNPJ>\n`;
        if (dados.destinatario.CPF) xml += `      <CPF>${dados.destinatario.CPF}</CPF>\n`;
        xml += `      <xNome>${dados.destinatario.xNome}</xNome>\n`;
        xml += '      <enderDest>\n';
        xml += `        <xLgr>${dados.destinatario.endereco.xLgr}</xLgr>\n`;
        xml += `        <nro>${dados.destinatario.endereco.nro}</nro>\n`;
        if (dados.destinatario.endereco.xCpl) xml += `        <xCpl>${dados.destinatario.endereco.xCpl}</xCpl>\n`;
        xml += `        <xBairro>${dados.destinatario.endereco.xBairro}</xBairro>\n`;
        xml += `        <cMun>${dados.destinatario.endereco.cMun}</cMun>\n`;
        xml += `        <xMun>${dados.destinatario.endereco.xMun}</xMun>\n`;
        xml += `        <UF>${dados.destinatario.endereco.UF}</UF>\n`;
        xml += `        <CEP>${dados.destinatario.endereco.CEP}</CEP>\n`;
        xml += `        <cPais>${dados.destinatario.endereco.cPais || '1058'}</cPais>\n`;
        xml += `        <xPais>${dados.destinatario.endereco.xPais || 'BRASIL'}</xPais>\n`;
        xml += '      </enderDest>\n';
        xml += `      <indIEDest>${dados.destinatario.indIEDest}</indIEDest>\n`;
        if (dados.destinatario.IE) xml += `      <IE>${dados.destinatario.IE}</IE>\n`;
        if (dados.destinatario.email) xml += `      <email>${dados.destinatario.email}</email>\n`;
        xml += '    </dest>\n';
        
        // PRODUTOS
        dados.produtos.forEach((produto, index) => {
            const nItem = index + 1;
            xml += `    <det nItem="${nItem}">\n`;
            xml += '      <prod>\n';
            xml += `        <cProd>${produto.cProd}</cProd>\n`;
            xml += `        <cEAN>${produto.cEAN || 'SEM GTIN'}</cEAN>\n`;
            xml += `        <xProd>${produto.xProd}</xProd>\n`;
            xml += `        <NCM>${produto.NCM}</NCM>\n`;
            xml += `        <CFOP>${produto.CFOP}</CFOP>\n`;
            xml += `        <uCom>${produto.uCom}</uCom>\n`;
            xml += `        <qCom>${produto.qCom.toFixed(4)}</qCom>\n`;
            xml += `        <vUnCom>${produto.vUnCom.toFixed(10)}</vUnCom>\n`;
            xml += `        <vProd>${produto.vProd.toFixed(2)}</vProd>\n`;
            xml += `        <cEANTrib>${produto.cEANTrib || produto.cEAN || 'SEM GTIN'}</cEANTrib>\n`;
            xml += `        <uTrib>${produto.uTrib || produto.uCom}</uTrib>\n`;
            xml += `        <qTrib>${(produto.qTrib || produto.qCom).toFixed(4)}</qTrib>\n`;
            xml += `        <vUnTrib>${(produto.vUnTrib || produto.vUnCom).toFixed(10)}</vUnTrib>\n`;
            xml += `        <indTot>${produto.indTot || '1'}</indTot>\n`;
            xml += '      </prod>\n';
            
            // IMPOSTOS
            xml += '      <imposto>\n';
            xml += '        <ICMS>\n';
            
            // Verifica se é Simples Nacional (CSOSN) ou Regime Normal (CST)
            if (produto.imposto.ICMS.CSOSN) {
                // Simples Nacional
                xml += `          <ICMSSN${produto.imposto.ICMS.CSOSN}>\n`;
                xml += `            <orig>${produto.imposto.ICMS.orig}</orig>\n`;
                xml += `            <CSOSN>${produto.imposto.ICMS.CSOSN}</CSOSN>\n`;
                if (produto.imposto.ICMS.pCredSN) xml += `            <pCredSN>${produto.imposto.ICMS.pCredSN.toFixed(2)}</pCredSN>\n`;
                if (produto.imposto.ICMS.vCredICMSSN) xml += `            <vCredICMSSN>${produto.imposto.ICMS.vCredICMSSN.toFixed(2)}</vCredICMSSN>\n`;
                xml += `          </ICMSSN${produto.imposto.ICMS.CSOSN}>\n`;
            } else {
                // Regime Normal
                xml += `          <ICMS${produto.imposto.ICMS.CST}>\n`;
                xml += `            <orig>${produto.imposto.ICMS.orig}</orig>\n`;
                xml += `            <CST>${produto.imposto.ICMS.CST}</CST>\n`;
                if (produto.imposto.ICMS.modBC) xml += `            <modBC>${produto.imposto.ICMS.modBC}</modBC>\n`;
                if (produto.imposto.ICMS.vBC) xml += `            <vBC>${produto.imposto.ICMS.vBC.toFixed(2)}</vBC>\n`;
                if (produto.imposto.ICMS.pICMS) xml += `            <pICMS>${produto.imposto.ICMS.pICMS.toFixed(2)}</pICMS>\n`;
                if (produto.imposto.ICMS.vICMS) xml += `            <vICMS>${produto.imposto.ICMS.vICMS.toFixed(2)}</vICMS>\n`;
                xml += `          </ICMS${produto.imposto.ICMS.CST}>\n`;
            }
            
            xml += '        </ICMS>\n';
            
            // PIS
            xml += '        <PIS>\n';
            if (produto.imposto.PIS.CST === '99' || !produto.imposto.PIS.vBC) {
                // PIS Outras Operações
                xml += '          <PISOutr>\n';
                xml += `            <CST>${produto.imposto.PIS.CST}</CST>\n`;
                if (produto.imposto.PIS.vBC) xml += `            <vBC>${produto.imposto.PIS.vBC.toFixed(2)}</vBC>\n`;
                if (produto.imposto.PIS.pPIS) xml += `            <pPIS>${produto.imposto.PIS.pPIS.toFixed(2)}</pPIS>\n`;
                xml += `            <vPIS>${(produto.imposto.PIS.vPIS || 0).toFixed(2)}</vPIS>\n`;
                xml += '          </PISOutr>\n';
            } else {
                // PIS Alíquota
                xml += '          <PISAliq>\n';
                xml += `            <CST>${produto.imposto.PIS.CST}</CST>\n`;
                if (produto.imposto.PIS.vBC) xml += `            <vBC>${produto.imposto.PIS.vBC.toFixed(2)}</vBC>\n`;
                if (produto.imposto.PIS.pPIS) xml += `            <pPIS>${produto.imposto.PIS.pPIS.toFixed(2)}</pPIS>\n`;
                if (produto.imposto.PIS.vPIS) xml += `            <vPIS>${produto.imposto.PIS.vPIS.toFixed(2)}</vPIS>\n`;
                xml += '          </PISAliq>\n';
            }
            xml += '        </PIS>\n';
            
            // COFINS
            xml += '        <COFINS>\n';
            if (produto.imposto.COFINS.CST === '99' || !produto.imposto.COFINS.vBC) {
                // COFINS Outras Operações
                xml += '          <COFINSOutr>\n';
                xml += `            <CST>${produto.imposto.COFINS.CST}</CST>\n`;
                if (produto.imposto.COFINS.vBC) xml += `            <vBC>${produto.imposto.COFINS.vBC.toFixed(2)}</vBC>\n`;
                if (produto.imposto.COFINS.pCOFINS) xml += `            <pCOFINS>${produto.imposto.COFINS.pCOFINS.toFixed(2)}</pCOFINS>\n`;
                xml += `            <vCOFINS>${(produto.imposto.COFINS.vCOFINS || 0).toFixed(2)}</vCOFINS>\n`;
                xml += '          </COFINSOutr>\n';
            } else {
                // COFINS Alíquota
                xml += '          <COFINSAliq>\n';
                xml += `            <CST>${produto.imposto.COFINS.CST}</CST>\n`;
                if (produto.imposto.COFINS.vBC) xml += `            <vBC>${produto.imposto.COFINS.vBC.toFixed(2)}</vBC>\n`;
                if (produto.imposto.COFINS.pCOFINS) xml += `            <pCOFINS>${produto.imposto.COFINS.pCOFINS.toFixed(2)}</pCOFINS>\n`;
                if (produto.imposto.COFINS.vCOFINS) xml += `            <vCOFINS>${produto.imposto.COFINS.vCOFINS.toFixed(2)}</vCOFINS>\n`;
                xml += '          </COFINSAliq>\n';
            }
            xml += '        </COFINS>\n';
            
            xml += '      </imposto>\n';
            xml += '    </det>\n';
        });
        
        // TOTAL
        xml += '    <total>\n';
        xml += '      <ICMSTot>\n';
        xml += `        <vBC>${vBC.toFixed(2)}</vBC>\n`;
        xml += `        <vICMS>${vICMS.toFixed(2)}</vICMS>\n`;
        xml += '        <vICMSDeson>0.00</vICMSDeson>\n';
        xml += '        <vFCP>0.00</vFCP>\n';
        xml += '        <vBCST>0.00</vBCST>\n';
        xml += '        <vST>0.00</vST>\n';
        xml += '        <vFCPST>0.00</vFCPST>\n';
        xml += '        <vFCPSTRet>0.00</vFCPSTRet>\n';
        xml += `        <vProd>${vProd.toFixed(2)}</vProd>\n`;
        xml += '        <vFrete>0.00</vFrete>\n';
        xml += '        <vSeg>0.00</vSeg>\n';
        xml += '        <vDesc>0.00</vDesc>\n';
        xml += '        <vII>0.00</vII>\n';
        xml += '        <vIPI>0.00</vIPI>\n';
        xml += '        <vIPIDevol>0.00</vIPIDevol>\n';
        xml += `        <vPIS>${vPIS.toFixed(2)}</vPIS>\n`;
        xml += `        <vCOFINS>${vCOFINS.toFixed(2)}</vCOFINS>\n`;
        xml += '        <vOutro>0.00</vOutro>\n';
        xml += `        <vNF>${vProd.toFixed(2)}</vNF>\n`;
        xml += '      </ICMSTot>\n';
        xml += '    </total>\n';
        
        // TRANSP
        xml += '    <transp>\n';
        xml += `      <modFrete>${dados.transporte?.modFrete || '9'}</modFrete>\n`;
        xml += '    </transp>\n';
        
        // PAG
        xml += '    <pag>\n';
        dados.pagamentos.forEach((pag) => {
            xml += '      <detPag>\n';
            xml += `        <indPag>${pag.indPag || '0'}</indPag>\n`;
            xml += `        <tPag>${pag.tPag}</tPag>\n`;
            xml += `        <vPag>${pag.vPag.toFixed(2)}</vPag>\n`;
            xml += '      </detPag>\n';
        });
        xml += '    </pag>\n';
        
        // INFO ADIC
        if (dados.infCpl) {
            xml += '    <infAdic>\n';
            xml += `      <infCpl>${dados.infCpl}</infCpl>\n`;
            xml += '    </infAdic>\n';
        }
        
        // RESPONSAVEL TECNICO (obrigatório desde 2019)
        xml += '    <infRespTec>\n';
        xml += '      <CNPJ>99999999000191</CNPJ>\n'; // CNPJ padrão para testes (pode ser substituído)
        xml += '      <xContato>Suporte Tecnico</xContato>\n';
        xml += '      <email>suporte@seuteste.com.br</email>\n';
        xml += '      <fone>1133334444</fone>\n';
        xml += '    </infRespTec>\n';
        
        xml += '  </infNFe>\n';
        xml += '</NFe>';
        
        return xml;
    }

    /**
    * Converte dados JSON da NFe para formato INI que o ACBr entende (DEPRECATED - usar jsonParaXML)
    */
    private jsonParaINI_OLD(dados: CriarNfeDto): string {
        const dataEmissao = dados.dataEmissao || new Date().toISOString();
        const tpAmb = dados.tpAmb || '2'; // Padrão: homologação
        
        let ini = '[Identificacao]\n';
        ini += `NaturezaOperacao=${dados.naturezaOperacao}\n`;
        ini += `Modelo=55\n`;
        ini += `Serie=${dados.serie}\n`;
        ini += `Numero=${dados.numero}\n`;
        ini += `DataEmissao=${dataEmissao}\n`;
        ini += `TipoNF=${dados.tpNF}\n`;
        ini += `DestinoOperacao=${dados.idDest}\n`;
        ini += `TipoAmbiente=${tpAmb}\n`;
        ini += `FinalidadeEmissao=${dados.finNFe}\n`;
        ini += `ConsumidorFinal=${dados.indFinal}\n`;
        ini += `PresencaComprador=${dados.indPres}\n`;
        ini += `TipoEmissao=1\n`;
        ini += `ProcessoEmissao=0\n`;
        ini += `VersaoProcesso=1.0\n\n`;

        // Emitente
        ini += '[Emitente]\n';
        ini += `CNPJ=${dados.emitente.CNPJ}\n`;
        ini += `RazaoSocial=${dados.emitente.xNome}\n`;
        if (dados.emitente.xFant) ini += `Fantasia=${dados.emitente.xFant}\n`;
        ini += `Logradouro=${dados.emitente.endereco.xLgr}\n`;
        ini += `Numero=${dados.emitente.endereco.nro}\n`;
        if (dados.emitente.endereco.xCpl) ini += `Complemento=${dados.emitente.endereco.xCpl}\n`;
        ini += `Bairro=${dados.emitente.endereco.xBairro}\n`;
        ini += `CodigoMunicipio=${dados.emitente.endereco.cMun}\n`;
        ini += `Municipio=${dados.emitente.endereco.xMun}\n`;
        ini += `UF=${dados.emitente.endereco.UF}\n`;
        ini += `CEP=${dados.emitente.endereco.CEP}\n`;
        ini += `CodigoPais=${dados.emitente.endereco.cPais || '1058'}\n`;
        ini += `Pais=${dados.emitente.endereco.xPais || 'BRASIL'}\n`;
        if (dados.emitente.endereco.fone) ini += `Telefone=${dados.emitente.endereco.fone}\n`;
        ini += `InscricaoEstadual=${dados.emitente.IE}\n`;
        ini += `RegimeTributario=${dados.emitente.CRT}\n\n`;

        // Destinatário
        ini += '[Destinatario]\n';
        if (dados.destinatario.CNPJ) ini += `CNPJ=${dados.destinatario.CNPJ}\n`;
        if (dados.destinatario.CPF) ini += `CPF=${dados.destinatario.CPF}\n`;
        ini += `RazaoSocial=${dados.destinatario.xNome}\n`;
        ini += `Logradouro=${dados.destinatario.endereco.xLgr}\n`;
        ini += `Numero=${dados.destinatario.endereco.nro}\n`;
        if (dados.destinatario.endereco.xCpl) ini += `Complemento=${dados.destinatario.endereco.xCpl}\n`;
        ini += `Bairro=${dados.destinatario.endereco.xBairro}\n`;
        ini += `CodigoMunicipio=${dados.destinatario.endereco.cMun}\n`;
        ini += `Municipio=${dados.destinatario.endereco.xMun}\n`;
        ini += `UF=${dados.destinatario.endereco.UF}\n`;
        ini += `CEP=${dados.destinatario.endereco.CEP}\n`;
        ini += `CodigoPais=${dados.destinatario.endereco.cPais || '1058'}\n`;
        ini += `Pais=${dados.destinatario.endereco.xPais || 'BRASIL'}\n`;
        if (dados.destinatario.endereco.fone) ini += `Telefone=${dados.destinatario.endereco.fone}\n`;
        ini += `IndicadorIE=${dados.destinatario.indIEDest}\n`;
        if (dados.destinatario.IE) ini += `InscricaoEstadual=${dados.destinatario.IE}\n`;
        if (dados.destinatario.email) ini += `Email=${dados.destinatario.email}\n`;
        ini += '\n';

        // Produtos
        dados.produtos.forEach((produto, index) => {
            const numItem = String(index + 1).padStart(3, '0');
            ini += `[Produto${numItem}]\n`;
            ini += `Codigo=${produto.cProd}\n`;
            ini += `CodigoBarras=${produto.cEAN || 'SEM GTIN'}\n`;
            ini += `Descricao=${produto.xProd}\n`;
            ini += `NCM=${produto.NCM}\n`;
            ini += `CFOP=${produto.CFOP}\n`;
            ini += `UnidadeComercial=${produto.uCom}\n`;
            ini += `QuantidadeComercial=${produto.qCom}\n`;
            ini += `ValorUnitario=${produto.vUnCom.toFixed(4)}\n`;
            ini += `ValorTotal=${produto.vProd.toFixed(2)}\n`;
            ini += `CodigoBarrasTributavel=${produto.cEANTrib || produto.cEAN || 'SEM GTIN'}\n`;
            ini += `UnidadeTributavel=${produto.uTrib || produto.uCom}\n`;
            ini += `QuantidadeTributavel=${produto.qTrib || produto.qCom}\n`;
            ini += `ValorUnitarioTributavel=${(produto.vUnTrib || produto.vUnCom).toFixed(4)}\n`;
            ini += `IndicadorTotal=${produto.indTot || '1'}\n\n`;

            // Impostos do Produto
            ini += `[ICMS${numItem}]\n`;
            ini += `Origem=${produto.imposto.ICMS.orig}\n`;
            ini += `CST=${produto.imposto.ICMS.CST}\n`;
            if (produto.imposto.ICMS.modBC) ini += `ModalidadeBC=${produto.imposto.ICMS.modBC}\n`;
            if (produto.imposto.ICMS.vBC) ini += `BaseCalculo=${produto.imposto.ICMS.vBC.toFixed(2)}\n`;
            if (produto.imposto.ICMS.pICMS) ini += `Aliquota=${produto.imposto.ICMS.pICMS.toFixed(2)}\n`;
            if (produto.imposto.ICMS.vICMS) ini += `Valor=${produto.imposto.ICMS.vICMS.toFixed(2)}\n`;
            ini += '\n';

            ini += `[PIS${numItem}]\n`;
            ini += `CST=${produto.imposto.PIS.CST}\n`;
            if (produto.imposto.PIS.vBC) ini += `BaseCalculo=${produto.imposto.PIS.vBC.toFixed(2)}\n`;
            if (produto.imposto.PIS.pPIS) ini += `Aliquota=${produto.imposto.PIS.pPIS.toFixed(2)}\n`;
            if (produto.imposto.PIS.vPIS) ini += `Valor=${produto.imposto.PIS.vPIS.toFixed(2)}\n`;
            ini += '\n';

            ini += `[COFINS${numItem}]\n`;
            ini += `CST=${produto.imposto.COFINS.CST}\n`;
            if (produto.imposto.COFINS.vBC) ini += `BaseCalculo=${produto.imposto.COFINS.vBC.toFixed(2)}\n`;
            if (produto.imposto.COFINS.pCOFINS) ini += `Aliquota=${produto.imposto.COFINS.pCOFINS.toFixed(2)}\n`;
            if (produto.imposto.COFINS.vCOFINS) ini += `Valor=${produto.imposto.COFINS.vCOFINS.toFixed(2)}\n`;
            ini += '\n';
        });

        // Totais (calculados automaticamente)
        const vProd = dados.produtos.reduce((sum, p) => sum + p.vProd, 0);
        const vICMS = dados.produtos.reduce((sum, p) => sum + (p.imposto.ICMS.vICMS || 0), 0);
        const vPIS = dados.produtos.reduce((sum, p) => sum + (p.imposto.PIS.vPIS || 0), 0);
        const vCOFINS = dados.produtos.reduce((sum, p) => sum + (p.imposto.COFINS.vCOFINS || 0), 0);

        ini += '[Total]\n';
        ini += `BaseCalculoICMS=${vProd.toFixed(2)}\n`;
        ini += `ValorICMS=${vICMS.toFixed(2)}\n`;
        ini += `ValorProdutos=${vProd.toFixed(2)}\n`;
        ini += `ValorPIS=${vPIS.toFixed(2)}\n`;
        ini += `ValorCOFINS=${vCOFINS.toFixed(2)}\n`;
        ini += `ValorNota=${vProd.toFixed(2)}\n\n`;

        // Transporte
        ini += '[Transporte]\n';
        ini += `ModalidadeFrete=${dados.transporte?.modFrete || '9'}\n\n`;

        // Pagamentos
        dados.pagamentos.forEach((pag, index) => {
            const numPag = String(index + 1).padStart(3, '0');
            ini += `[Pagamento${numPag}]\n`;
            ini += `IndicadorPagamento=${pag.indPag || '0'}\n`;
            ini += `FormaPagamento=${pag.tPag}\n`;
            ini += `Valor=${pag.vPag.toFixed(2)}\n\n`;
        });

        // Informações Adicionais
        if (dados.infCpl) {
            ini += '[InformacoesAdicionais]\n';
            ini += `Complementares=${dados.infCpl}\n\n`;
        }

        return ini;
    }

    /**
    * Cria uma NFe a partir de dados JSON
    * @returns Caminho do arquivo XML gerado
    */
    async criarNFeDeJSON(dados: CriarNfeDto): Promise<{ xmlPath: string }> {
        try {
            this.logger.log('Criando NFe a partir de JSON...');
            
            // Limpa a lista antes de criar nova NFe
            this.limpar();

            // Converte JSON para XML
            const xmlContent = this.jsonParaXML(dados);
            
            // Salva o XML temporário
            const xmlPath = path.resolve(process.cwd(), 'data', 'notas', `nfe-${Date.now()}.xml`);
            fs.writeFileSync(xmlPath, xmlContent, 'utf-8');
            
            this.logger.log(`XML criado: ${xmlPath}`);
            
            // Carrega o XML no ACBr
            this.acbrNFe.carregarXML(xmlPath);
            
            this.logger.log('NFe carregada com sucesso no ACBr');
            
            return { xmlPath };
        } catch (error) {
            this.logger.error('Erro ao criar NFe:', error);
            throw error;
        }
    }

    /**
    * Obtém o XML gerado pelo ACBr
    * @param index Índice da NFe na lista (padrão: 0)
    */
    async obterXmlGerado(index: number = 0): Promise<string> {
        try {
            const xml = this.acbrNFe.obterXml(index);
            this.logger.log('XML obtido com sucesso');
            return xml;
        } catch (error) {
            this.logger.error('Erro ao obter XML:', error);
            throw error;
        }
    }
}
