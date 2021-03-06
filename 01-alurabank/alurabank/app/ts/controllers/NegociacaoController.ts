import { NegociacoesView, MensagemView} from '../views/index';
import { Negociacoes, Negociacao, NegociacaoParcial } from '../models/index';
import { logarTempoDeExecucao, domInject, throttle } from '../helpers/decorators/index';
import { NegociacaoService } from '../service/index';
import { imprime } from '../helpers/Utils';

export class NegociacaoController {

    @domInject('#data')
    private _inputData: JQuery;
    @domInject('#quantidade')
    private _inputQuantidade: JQuery;
    @domInject('#valor')
    private _inputValor: JQuery;
    private _negociacoes = new Negociacoes();
    private _negociacoesView = new NegociacoesView('#negociacoesView');
    private _mensagemView = new MensagemView('#mensagemView');
    private _service = new NegociacaoService;

    constructor() {
       // atualiza a view para exibir os dados do modelo, vazio
        this._negociacoesView.update(this._negociacoes);
    }

    @throttle()
    @logarTempoDeExecucao(true)
    adiciona(event: Event) {

        event.preventDefault();

        let data =  new Date(this._inputData.val().replace(/-/g, ','));
        if(!this._ehDiaUtil(data)){
            this._mensagemView.update("Somente são aceitos dias úteis nas negociações!");
            return
        }

        const negociacao = new Negociacao(
            data, 
            parseInt(this._inputQuantidade.val()),
            parseFloat(this._inputValor.val())
        );

        this._negociacoes.adiciona(negociacao);

        imprime(negociacao, this._negociacoes);

        // depois de adicionar, atualiza a view novamente para refletir os dados
        this._negociacoesView.update(this._negociacoes);

        this._mensagemView.update('Negociação adicionada com sucesso');

    }

    private _ehDiaUtil(data: Date){
        return data.getDay() != DiaDaSemana.Domingo && data.getDay() != DiaDaSemana.Sabado;
    }

    @throttle()
    async importarDados(){
        
        // usou await antes da chamada de this.service.obterNegociacoes()
        try {
            const negociacoesParaImportar = await this._service
            .obterNegociacoes(res => {
                if (res.ok)
                    return res;
                else {
                    throw new Error(res.statusText);
                }
            });

            const negociacoesJaImportadas = this._negociacoes.paraArray();

            negociacoesParaImportar
                .filter(negociacao => 
                    !negociacoesJaImportadas.some (jaImportada => 
                        negociacao.ehIgual(jaImportada)))
                        .forEach(negociacao => this._negociacoes.adiciona(negociacao));
            
            this._negociacoesView.update(this._negociacoes);

        } catch{
            this._mensagemView.update('Não foi possível importar os dados.');
        }
    }
}

enum DiaDaSemana {
    Domingo,
    Segunda,
    Terca,
    Quarta,
    Quinta,
    Sexta,
    Sabado
}