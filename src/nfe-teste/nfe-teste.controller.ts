import { 
    Controller, 
    Post, 
    Get, 
    Body, 
    Param, 
    Query,
    HttpException, 
    HttpStatus,
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { NfeTesteService } from './nfe-teste.service';
  import { CriarNfeDto } from './dto/criar-nfe.dto';
  import { diskStorage } from 'multer';
  import * as path from 'path';

@Controller('nfe-teste')
export class NfeTesteController {
    constructor(private readonly nfeService: NfeTesteService) {}

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

    @Post('criar')
    async criarNFe(@Body() dados: CriarNfeDto) {
        try {
            // 1. Cria a NFe a partir do JSON
            const resultado = await this.nfeService.criarNFeDeJSON(dados);
            
            // 2. Obtém o XML gerado pelo ACBr
            const xml = await this.nfeService.obterXmlGerado();
            
            // 3. Extrai a chave de acesso do XML
            const chaveMatch = xml.match(/Id="NFe(\d{44})"/);
            const chaveAcesso = chaveMatch ? chaveMatch[1] : null;
            
            return {
                success: true,
                message: 'NFe criada com sucesso (ainda não assinada)',
                data: {
                    chaveAcesso,
                    serie: dados.serie,
                    numero: dados.numero,
                    valor: dados.produtos.reduce((sum, p) => sum + p.vProd, 0),
                    destinatario: dados.destinatario.xNome,
                    xmlPath: resultado.xmlPath,
                    proximosPassos: [
                        '1. Assinar a NFe: POST /api/nfe-teste/assinar',
                        '2. Validar a NFe: POST /api/nfe-teste/validar',
                        '3. Enviar para SEFAZ: POST /api/nfe-teste/enviar'
                    ]
                }
            };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Get('obter-xml')
    async obterXml() {
        try {
            const xml = await this.nfeService.obterXmlGerado();
            return {
                success: true,
                data: { xml }
            };
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
            // 1. Cria a NFe
            const resultado = await this.nfeService.criarNFeDeJSON(dados);
            
            // 2. Assina
            await this.nfeService.assinar();
            
            // 3. Valida
            await this.nfeService.validar();
            
            // 4. Obtém o XML assinado
            const xml = await this.nfeService.obterXmlGerado();
            
            // 5. Extrai a chave de acesso
            const chaveMatch = xml.match(/Id="NFe(\d{44})"/);
            const chaveAcesso = chaveMatch ? chaveMatch[1] : null;
            
            return {
                success: true,
                message: 'NFe criada, assinada e validada com sucesso',
                data: {
                    chaveAcesso,
                    serie: dados.serie,
                    numero: dados.numero,
                    valor: dados.produtos.reduce((sum, p) => sum + p.vProd, 0),
                    destinatario: dados.destinatario.xNome,
                    xmlPath: resultado.xmlPath,
                    status: 'Pronta para envio',
                    proximoPasso: 'Enviar para SEFAZ: POST /api/nfe-teste/enviar com body: {"lote": 1, "sincrono": true}'
                }
            };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('upload-xml')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: path.resolve(process.cwd(), 'data', 'notas'),
                filename: (req, file, cb) => {
                    cb(null, `${Date.now()}-${file.originalname}`);
                }
            }),
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'text/xml' || file.originalname.endsWith('.xml')) {
                    cb(null, true);
                } else {
                    cb (new Error('Apenas arquivos XML são permitidos'), false);
                }
            },
        }),
    )
    async uploadXML(@UploadedFile() file: Express.Multer.File) {
        try {
            await this.nfeService.carregarXML(file.path);
            return {
                success: true,
                message: 'XML carregado com sucesso',
                filename: file.filename
            };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('assinar')
    async assinar() {
        try {
            await this.nfeService.assinar();
            return { success: true, message: 'NFe assinada com sucesso' };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('validar')
    async validar() {
        try {
            await this.nfeService.validar();
            return { success: true, message: 'NFe validada com sucesso' };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Post('enviar')
    async enviar(
        @Body() body: { lote?: number; imprimir?: boolean; sincrono?: boolean; zipado?: boolean },
    ) {
        try {
            const resultado = await this.nfeService.enviar(
                body.lote,
                body.imprimir,
                body.sincrono,
                body.zipado,
            );
            
            // Parsear resultado INI para JSON mais legível
            const linhas = resultado.split(/\r?\n/);
            const parsed: any = {};
            let secaoAtual = 'root';
            
            for (const linha of linhas) {
                const trimmed = linha.trim();
                if (!trimmed) continue;
                
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    secaoAtual = trimmed.slice(1, -1);
                    parsed[secaoAtual] = {};
                } else if (trimmed.includes('=')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    const value = valueParts.join('=').trim();
                    if (secaoAtual === 'root') {
                        parsed[key.trim()] = value || null;
                    } else {
                        parsed[secaoAtual][key.trim()] = value || null;
                    }
                }
            }
            
            const cStat = parsed.Envio?.CStat || parsed.CStat;
            const sucesso = cStat === '100' || cStat === '101' || cStat === '150'; // 100=Autorizada, 101=Cancelada, 150=Autorizada fora de prazo
            
            return {
                success: sucesso,
                message: sucesso ? 'NFe autorizada com sucesso!' : `Rejeição: ${parsed.Envio?.XMotivo || parsed.XMotivo}`,
                data: parsed,
                raw: resultado
            };
        } catch (error) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
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
