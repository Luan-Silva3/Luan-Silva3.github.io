// ========================================
// ELEMENTOS DA PÁGINA
// ========================================

const filtroPeriodo =
    document.getElementById("filtroPeriodo");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const btnVoltar =
    document.getElementById("btnVoltar");

const loading =
    document.getElementById("loading");

const errorMessage =
    document.getElementById("errorMessage");


// ========================================
// FORMATAÇÃO DE MOEDA
// ========================================

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


// ========================================
// DATAS
// ========================================

function obterPeriodo(tipo) {

    const hoje = new Date();

    let inicio = null;
    let fim = new Date(hoje);

    fim.setHours(23, 59, 59, 999);


    // ESTE MÊS

    if (tipo === "mes") {

        inicio = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            1
        );
    }


    // ÚLTIMOS 3 MESES

    if (tipo === "3meses") {

        inicio = new Date(hoje);

        inicio.setMonth(
            hoje.getMonth() - 2
        );

        inicio.setDate(1);
    }


    // ESTE ANO

    if (tipo === "ano") {

        inicio = new Date(
            hoje.getFullYear(),
            0,
            1
        );
    }


    // TODO O PERÍODO

    if (tipo === "todos") {

        inicio = null;
        fim = null;
    }


    return {
        inicio,
        fim
    };
}


// ========================================
// TEXTO DO PERÍODO
// ========================================

function atualizarTextoPeriodo(tipo) {

    const elemento =
        document.getElementById("periodInfo");

    if (!elemento) {
        return;
    }


    const textos = {

        mes: "Dados do mês atual",

        "3meses":
            "Dados dos últimos 3 meses",

        ano:
            "Dados do ano atual",

        todos:
            "Todos os dados cadastrados"

    };


    elemento.textContent =
        textos[tipo] || "";
}


// ========================================
// VERIFICAR DATA
// ========================================

function dentroDoPeriodo(
    dataTexto,
    inicio,
    fim
) {

    if (!dataTexto) {

        return true;
    }


    if (!inicio && !fim) {

        return true;
    }


    const data =
        new Date(dataTexto);


    if (inicio && data < inicio) {

        return false;
    }


    if (fim && data > fim) {

        return false;
    }


    return true;
}


// ========================================
// CARREGAR RELATÓRIOS
// ========================================

async function carregarRelatorios() {

    try {

        loading.style.display = "block";

        errorMessage.style.display = "none";


        // --------------------------------
        // SESSÃO
        // --------------------------------

        const {
            data: { session },
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {

            throw sessionError;
        }


        if (!session || !session.user) {

            window.location.replace(
                "login.html"
            );

            return;
        }


        const userId =
            session.user.id;


        // --------------------------------
        // PERÍODO
        // --------------------------------

        const tipoPeriodo =
            filtroPeriodo.value;


        const {
            inicio,
            fim
        } = obterPeriodo(tipoPeriodo);


        atualizarTextoPeriodo(
            tipoPeriodo
        );


        // --------------------------------
        // BUSCAR DADOS
        // --------------------------------

        const [

            transacoesResponse,

            servicosResponse,

            clientesResponse,

            produtosResponse

        ] = await Promise.all([


            // FINANCEIRO

            supabaseClient
                .from("transactions")
                .select(
                    "type, amount, status, due_date, payment_date, created_at"
                )
                .eq(
                    "user_id",
                    userId
                ),


            // SERVIÇOS

            supabaseClient
                .from("services")
                .select(
                    "status, created_at"
                )
                .eq(
                    "user_id",
                    userId
                ),


            // CLIENTES

            supabaseClient
                .from("clients")
                .select(
                    "id, created_at"
                )
                .eq(
                    "user_id",
                    userId
                ),


            // PRODUTOS

            supabaseClient
                .from("products")
                .select(
                    "stock_quantity, minimum_stock, sale_price, created_at"
                )
                .eq(
                    "user_id",
                    userId
                )

        ]);


        // --------------------------------
        // VERIFICAR ERROS
        // --------------------------------

        if (transacoesResponse.error) {

            throw transacoesResponse.error;
        }


        if (servicosResponse.error) {

            throw servicosResponse.error;
        }


        if (clientesResponse.error) {

            throw clientesResponse.error;
        }


        if (produtosResponse.error) {

            throw produtosResponse.error;
        }


        const transacoes =
            transacoesResponse.data || [];


        const servicos =
            servicosResponse.data || [];


        const clientes =
            clientesResponse.data || [];


        const produtos =
            produtosResponse.data || [];


        // ========================================
        // FINANCEIRO
        // ========================================

        let receitas = 0;

        let despesas = 0;


        transacoes.forEach(
            function (transacao) {


                // Não contabilizar cancelados

                if (
                    transacao.status ===
                    "Cancelado"
                ) {

                    return;
                }


                /*
                 * Preferimos a data de pagamento.
                 * Caso não exista, usamos vencimento.
                 * Por último, usamos criação.
                 */

                const dataReferencia =
                    transacao.payment_date ||
                    transacao.due_date ||
                    transacao.created_at;


                if (
                    !dentroDoPeriodo(
                        dataReferencia,
                        inicio,
                        fim
                    )
                ) {

                    return;
                }


                const valor =
                    Number(
                        transacao.amount || 0
                    );


                if (
                    transacao.type ===
                    "Receita"
                ) {

                    receitas += valor;
                }


                if (
                    transacao.type ===
                    "Despesa"
                ) {

                    despesas += valor;
                }

            }
        );


        const saldo =
            receitas - despesas;


        // ========================================
        // SERVIÇOS
        // ========================================

        const servicosPeriodo =
            servicos.filter(
                function (servico) {

                    return dentroDoPeriodo(
                        servico.created_at,
                        inicio,
                        fim
                    );

                }
            );


        const servicosConcluidos =
            servicosPeriodo.filter(
                function (servico) {

                    return (
                        servico.status ===
                        "Concluído"
                    );

                }
            ).length;


        const servicosAndamento =
            servicosPeriodo.filter(
                function (servico) {

                    return (
                        servico.status ===
                            "Em andamento" ||
                        servico.status ===
                            "Em Andamento"
                    );

                }
            ).length;


        // ========================================
        // CLIENTES
        // ========================================

        const clientesPeriodo =
            clientes.filter(
                function (cliente) {

                    return dentroDoPeriodo(
                        cliente.created_at,
                        inicio,
                        fim
                    );

                }
            );


        // ========================================
        // PRODUTOS
        // ========================================

        /*
         * Estoque representa o estado atual.
         * Portanto não filtramos produtos pelo período.
         */

        const totalProdutos =
            produtos.length;


        const estoqueBaixo =
            produtos.filter(
                function (produto) {

                    return (
                        Number(
                            produto.stock_quantity
                        ) <=
                        Number(
                            produto.minimum_stock
                        )
                    );

                }
            ).length;


        let valorEstoque = 0;


        produtos.forEach(
            function (produto) {

                valorEstoque +=
                    Number(
                        produto.stock_quantity || 0
                    ) *
                    Number(
                        produto.sale_price || 0
                    );

            }
        );


        // ========================================
        // ATUALIZAR INTERFACE
        // ========================================

        document.getElementById(
            "relatorioReceitas"
        ).textContent =
            formatarMoeda(receitas);


        document.getElementById(
            "relatorioDespesas"
        ).textContent =
            formatarMoeda(despesas);


        document.getElementById(
            "relatorioSaldo"
        ).textContent =
            formatarMoeda(saldo);


        document.getElementById(
            "relatorioClientes"
        ).textContent =
            clientesPeriodo.length;


        // ========================================
        // GRÁFICO
        // ========================================

        document.getElementById(
            "graficoReceitasValor"
        ).textContent =
            formatarMoeda(receitas);


        document.getElementById(
            "graficoDespesasValor"
        ).textContent =
            formatarMoeda(despesas);


        const maiorValor =
            Math.max(
                receitas,
                despesas,
                1
            );


        document.getElementById(
            "barraReceitas"
        ).style.width =
            `${(receitas / maiorValor) * 100}%`;


        document.getElementById(
            "barraDespesas"
        ).style.width =
            `${(despesas / maiorValor) * 100}%`;


        document.getElementById(
            "resultadoPeriodo"
        ).textContent =
            formatarMoeda(saldo);


        // ========================================
        // SERVIÇOS
        // ========================================

        document.getElementById(
            "totalServicosRelatorio"
        ).textContent =
            servicosPeriodo.length;


        document.getElementById(
            "servicosConcluidos"
        ).textContent =
            servicosConcluidos;


        document.getElementById(
            "servicosAndamento"
        ).textContent =
            servicosAndamento;


        // ========================================
        // CLIENTES
        // ========================================

        document.getElementById(
            "clientesTotal"
        ).textContent =
            clientesPeriodo.length;


        // ========================================
        // ESTOQUE
        // ========================================

        document.getElementById(
            "totalProdutos"
        ).textContent =
            totalProdutos;


        document.getElementById(
            "estoqueBaixo"
        ).textContent =
            estoqueBaixo;


        document.getElementById(
            "valorEstoque"
        ).textContent =
            formatarMoeda(
                valorEstoque
            );


        console.log(
            "Relatórios carregados:",
            {
                receitas,
                despesas,
                saldo,
                clientes:
                    clientesPeriodo.length,
                servicos:
                    servicosPeriodo.length,
                produtos:
                    totalProdutos,
                estoqueBaixo,
                valorEstoque
            }
        );


    } catch (error) {

        console.error(
            "Erro ao carregar relatórios:",
            error
        );


        errorMessage.textContent =
            "Não foi possível carregar os relatórios. Verifique o console.";


        errorMessage.style.display =
            "block";


    } finally {

        loading.style.display =
            "none";

    }

}


// ========================================
// FILTRO
// ========================================

filtroPeriodo.addEventListener(
    "change",
    carregarRelatorios
);


// ========================================
// ATUALIZAR
// ========================================

btnAtualizar.addEventListener(
    "click",
    carregarRelatorios
);


// ========================================
// VOLTAR
// ========================================

btnVoltar.addEventListener(
    "click",
    function () {

        window.location.href =
            "dashboard.html";

    }
);


// ========================================
// INICIAR
// ========================================

carregarRelatorios();