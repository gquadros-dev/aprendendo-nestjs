import { 
    Controller, 
    Post, 
    Get, 
    Body, 
    Param, 
    Query,
    HttpException, 
    HttpStatus,
  } from '@nestjs/common';
  import { NfeTesteService } from './nfe-teste.service';
  import { CriarNfeDto } from './dto/criar-nfe.dto';

@Controller('nfe-teste')
export class NfeTesteController {
    constructor(private readonly nfeService: NfeTesteService) {}

    @Get('debug')
    async getDebugInfo() {
        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            env: {
                LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH,
                DISPLAY: process.env.DISPLAY,
                DATABASE_HOST: process.env.DATABASE_HOST,
            },
            paths: {
                cwd: process.cwd(),
                lib: process.cwd() + '/lib',
            }
        };
    }

    @Get('status') 
    async getStatus() {
        try {
            const status = await this.nfeService.statusServico();
            return { success: true, data: status };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    @Post('criar-assinar-validar')
    async criarAssinarValidar(@Body() dados: CriarNfeDto) {
        try {
            // Cria, assina, valida e salva no banco
            const nfe = await this.nfeService.criarAssinarValidarESalvar(dados);
            
            return {
                success: true,
                message: 'NFe criada, assinada, validada e salva no banco com sucesso',
                data: {
                    id: nfe.id,
                    chaveAcesso: nfe.chave,
                    serie: nfe.serie,
                    numero: nfe.numero,
                    valor: nfe.valor_total,
                    destinatario: nfe.destinatario_nome,
                    status: nfe.status,
                    createdAt: nfe.created_at,
                    proximoPasso: `Enviar para SEFAZ: POST /api/nfe-teste/envio com body: {"nfeIds": [${nfe.id}], "sincrono": true}`
                }
            };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('envio')
    async enviarLote(
        @Body() body: { 
            nfeIds: number[];    // IDs das NFes no banco
            sincrono?: boolean;  // Aguardar resposta da SEFAZ (padrão: true)
            zipado?: boolean;    // Compactar XMLs (padrão: false)
        }
    ) {
        try {
            if (!body.nfeIds || body.nfeIds.length === 0) {
                throw new Error('Informe ao menos um ID de NFe para enviar');
            }

            const resultado = await this.nfeService.enviarLote(
                body.nfeIds,
                body.sincrono !== false,
                body.zipado || false
            );
            
            const retornoEnvio = resultado.resultado.Envio || resultado.resultado;
            const cStat = retornoEnvio.CStat;
            const xMotivo = retornoEnvio.XMotivo || retornoEnvio.Msg;
            const sucesso = cStat === '100' || cStat === '150';
            
            return {
                success: sucesso,
                message: sucesso 
                    ? `✅ Lote com ${body.nfeIds.length} NFe(s) autorizado com sucesso!` 
                    : `❌ Rejeição: ${xMotivo}`,
                data: {
                    nfesEnviadas: resultado.nfes,
                    retornoSefaz: resultado.resultado,
                    detalhes: {
                        codigoStatus: cStat,
                        protocolo: retornoEnvio.NProt,
                        dataRecebimento: retornoEnvio.DhRecbto,
                        mensagem: xMotivo
                    }
                }
            };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('listar')
    async listarNFes(@Query('limite') limite?: string) {
        try {
            const lim = limite ? parseInt(limite) : 50;
            const nfes = await this.nfeService.listarNFes(lim);
            
            return {
                success: true,
                total: nfes.length,
                data: nfes.map(nfe => ({
                    id: nfe.id,
                    chave: nfe.chave,
                    serie: nfe.serie,
                    numero: nfe.numero,
                    emitente: nfe.emitente_nome,
                    destinatario: nfe.destinatario_nome,
                    valor: nfe.valor_total,
                    status: nfe.status,
                    codigoStatusSefaz: nfe.codigo_status_sefaz,
                    protocolo: nfe.protocolo,
                    mensagemSefaz: nfe.mensagem_sefaz,
                    dataAutorizacao: nfe.data_autorizacao,
                    criadaEm: nfe.created_at,
                }))
            };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id')
    async buscarNFePorId(@Param('id') id: string) {
        try {
            const nfes = await this.nfeService.buscarNFesPorIds([parseInt(id)]);
            
            if (nfes.length === 0) {
                throw new HttpException(
                    { success: false, message: 'NFe não encontrada' },
                    HttpStatus.NOT_FOUND
                );
            }
            
            return {
                success: true,
                data: nfes[0]
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


    @Get('consultar/:chave')
    async consultar(
        @Param('chave') chave: string,
        @Query('extrairEventos') extrairEventos?: string,
    ) {
        try {
            const extrair = extrairEventos === 'false' ? false : true;
            const resultado = await this.nfeService.consultar(chave, extrair);
            return { success: true, data: resultado };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('cancelar')
    async cancelar(
        @Body() body: { 
            chave: string; 
            justificativa: string; 
            cnpj: string; 
            lote?: number 
        },
    ) {
        try {
            const resultado = await this.nfeService.cancelar(
                body.chave,
                body.justificativa,
                body.cnpj,
                body.lote,
            );
            return { success: true, data: resultado };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('gerar-pdf')
    async gerarPDF() {
        try {
            await this.nfeService.imprimirPDF();
            return { success: true, message: 'PDF gerado com sucesso' };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
