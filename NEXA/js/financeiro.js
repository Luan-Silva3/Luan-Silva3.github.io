// ==========================================
// NEXA - FINANCEIRO
// ==========================================

// Elementos da página
const formularioCard = document.getElementById("formularioCard");
const formFinanceiro = document.getElementById("formFinanceiro");

const movimentacaoId = document.getElementById("movimentacaoId");
const tipo = document.getElementById("tipo");
const status = document.getElementById("status");
const descricao = document.getElementById("descricao");
const categoria = document.getElementById("categoria");
const valor = document.getElementById("valor");
const dataVencimento = document.getElementById("dataVencimento");
const dataPagamento = document.getElementById("dataPagamento");
const observacoes = document.getElementById("observacoes");

const listaMovimentacoes =
    document.getElementById("listaMovimentacoes");

const buscaMovimentacao =
    document.getElementById("buscaMovimentacao");

const filtroTipo =
    document.getElementById("filtroTipo");

const filtroStatus =
    document.getElementById("filtroStatus");

const btnNovaMovimentacao =
    document.getElementById("btnNovaMovimentacao");

const btnCancelar =
    document.getElementById("btnCancelar");

const btnFecharFormulario =
    document.getElementById("btnFecharFormulario");

const tituloFormulario =
    document.getElementById("tituloFormulario");

const mensagem =
    document.getElementById("mensagem");


// Resumo
const saldo = document.getElementById("saldo");
const totalReceitas = document.getElementById("totalReceitas");
const totalDespesas = document.getElementById("totalDespesas");
const totalPendentes = document.getElementById("totalPendentes");


// Estado
let usuarioAtual = null;
let movimentacoes = [];


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", iniciar);


async function iniciar() {

    try {

        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();


        if (error) {
            throw error;
        }


        if (!session) {

            window.location.href = "login.html";

            return;
        }


        usuarioAtual = session.user;


        await carregarMovimentacoes();


    } catch (erro) {

        console.error(
            "Erro ao iniciar financeiro:",
            erro
        );

        mostrarMensagem(
            "Não foi possível carregar o financeiro.",
            true
        );
    }
}


// ==========================================
// CARREGAR MOVIMENTAÇÕES
// ==========================================

async function carregarMovimentacoes() {

    const {
        data,
        error
    } = await supabaseClient

        .from("transactions")

        .select(`
            id,
            type,
            description,
            category,
            amount,
            due_date,
            payment_date,
            status,
            notes,
            created_at
        `)

        .eq(
            "user_id",
            usuarioAtual.id
        )

        .order(
            "due_date",
            {
                ascending: true,
                nullsFirst: false
            }
        );


    if (error) {

        console.error(
            "Erro ao carregar movimentações:",
            error
        );

        mostrarMensagem(
            "Erro ao carregar as movimentações.",
            true
        );

        return;
    }


    movimentacoes = data || [];


    atualizarResumo();

    aplicarFiltros();
}


// ==========================================
// ATUALIZAR RESUMO
// ==========================================

function atualizarResumo() {

    let receitas = 0;

    let despesas = 0;

    let pendentes = 0;


    movimentacoes.forEach(movimentacao => {

        const valorMovimentacao =
            Number(
                movimentacao.amount
            ) || 0;


        // Movimentações canceladas
        // não entram no cálculo
        if (
            movimentacao.status ===
            "Cancelado"
        ) {
            return;
        }


        if (
            movimentacao.type ===
            "Receita"
        ) {

            receitas += valorMovimentacao;

        } else if (
            movimentacao.type ===
            "Despesa"
        ) {

            despesas += valorMovimentacao;
        }


        if (
            movimentacao.status ===
            "Pendente"
        ) {

            pendentes += valorMovimentacao;
        }

    });


    const resultado =
        receitas - despesas;


    totalReceitas.textContent =
        formatarMoeda(receitas);


    totalDespesas.textContent =
        formatarMoeda(despesas);


    saldo.textContent =
        formatarMoeda(resultado);


    totalPendentes.textContent =
        formatarMoeda(pendentes);
}


// ==========================================
// RENDERIZAR LISTA
// ==========================================

function renderizarMovimentacoes(lista) {

    if (!lista.length) {

        listaMovimentacoes.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="estado-vazio"
                >
                    Nenhuma movimentação encontrada.
                </td>
            </tr>
        `;

        return;
    }


    listaMovimentacoes.innerHTML =
        lista.map(movimentacao => {

            const valorMovimentacao =
                Number(
                    movimentacao.amount
                ) || 0;


            const classeValor =
                movimentacao.type === "Receita"
                    ? "valor-receita"
                    : "valor-despesa";


            const sinal =
                movimentacao.type === "Receita"
                    ? "+"
                    : "-";


            const classeStatus =
                movimentacao.status
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, "-");


            return `
                <tr>

                    <td>
                        <strong>
                            ${escaparHTML(
                                movimentacao.description
                            )}
                        </strong>
                    </td>


                    <td>
                        ${escaparHTML(
                            movimentacao.type
                        )}
                    </td>


                    <td>
                        ${
                            movimentacao.category
                                ? escaparHTML(
                                    movimentacao.category
                                )
                                : "-"
                        }
                    </td>


                    <td>
                        ${
                            movimentacao.due_date
                                ? formatarData(
                                    movimentacao.due_date
                                )
                                : "-"
                        }
                    </td>


                    <td class="${classeValor}">
                        ${sinal}
                        ${formatarMoeda(
                            valorMovimentacao
                        )}
                    </td>


                    <td>
                        <span
                            class="status ${classeStatus}"
                        >
                            ${escaparHTML(
                                movimentacao.status
                            )}
                        </span>
                    </td>


                    <td>

                        <div class="acoes">

                            <button
                                class="btn-acao"
                                onclick="editarMovimentacao('${movimentacao.id}')"
                            >
                                Editar
                            </button>


                            <button
                                class="btn-acao btn-excluir"
                                onclick="excluirMovimentacao('${movimentacao.id}')"
                            >
                                Excluir
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");
}


// ==========================================
// FILTROS
// ==========================================

function aplicarFiltros() {

    const texto =
        buscaMovimentacao.value
            .trim()
            .toLowerCase();


    const tipoSelecionado =
        filtroTipo.value;


    const statusSelecionado =
        filtroStatus.value;


    const resultado =
        movimentacoes.filter(
            movimentacao => {

                const correspondeTexto =
                    !texto ||
                    movimentacao.description
                        .toLowerCase()
                        .includes(texto) ||

                    (
                        movimentacao.category &&
                        movimentacao.category
                            .toLowerCase()
                            .includes(texto)
                    );


                const correspondeTipo =
                    tipoSelecionado === "todos" ||
                    movimentacao.type ===
                    tipoSelecionado;


                const correspondeStatus =
                    statusSelecionado === "todos" ||
                    movimentacao.status ===
                    statusSelecionado;


                return (
                    correspondeTexto &&
                    correspondeTipo &&
                    correspondeStatus
                );
            }
        );


    renderizarMovimentacoes(resultado);
}


// Eventos dos filtros

buscaMovimentacao.addEventListener(
    "input",
    aplicarFiltros
);


filtroTipo.addEventListener(
    "change",
    aplicarFiltros
);


filtroStatus.addEventListener(
    "change",
    aplicarFiltros
);


// ==========================================
// ABRIR FORMULÁRIO
// ==========================================

btnNovaMovimentacao.addEventListener(
    "click",
    () => {

        limparFormulario();

        formularioCard.classList.add(
            "visivel"
        );

        tituloFormulario.textContent =
            "Nova movimentação";


        formularioCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


// ==========================================
// FECHAR FORMULÁRIO
// ==========================================

btnCancelar.addEventListener(
    "click",
    fecharFormulario
);


btnFecharFormulario.addEventListener(
    "click",
    fecharFormulario
);


function fecharFormulario() {

    formularioCard.classList.remove(
        "visivel"
    );

    limparFormulario();
}


// ==========================================
// SALVAR MOVIMENTAÇÃO
// ==========================================

formFinanceiro.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!usuarioAtual) {

            mostrarMensagem(
                "Usuário não autenticado.",
                true
            );

            return;
        }


        const dados = {

            user_id:
                usuarioAtual.id,

            type:
                tipo.value,

            description:
                descricao.value.trim(),

            category:
                categoria.value.trim() ||
                null,

            amount:
                Number(valor.value) || 0,

            due_date:
                dataVencimento.value ||
                null,

            payment_date:
                dataPagamento.value ||
                null,

            status:
                status.value,

            notes:
                observacoes.value.trim() ||
                null

        };


        if (!dados.description) {

            mostrarMensagem(
                "Digite uma descrição.",
                true
            );

            return;
        }


        if (dados.amount <= 0) {

            mostrarMensagem(
                "Digite um valor maior que zero.",
                true
            );

            return;
        }


        const id =
            movimentacaoId.value;


        try {

            let error;


            // ==================================
            // EDITAR
            // ==================================

            if (id) {

                const resultado =
                    await supabaseClient

                        .from("transactions")

                        .update(dados)

                        .eq(
                            "id",
                            id
                        )

                        .eq(
                            "user_id",
                            usuarioAtual.id
                        );


                error =
                    resultado.error;


            }

            // ==================================
            // NOVO
            // ==================================

            else {

                const resultado =
                    await supabaseClient

                        .from("transactions")

                        .insert([
                            dados
                        ]);


                error =
                    resultado.error;
            }


            if (error) {
                throw error;
            }


            mostrarMensagem(
                id
                    ? "Movimentação atualizada com sucesso!"
                    : "Movimentação cadastrada com sucesso!"
            );


            await carregarMovimentacoes();


            setTimeout(() => {

                fecharFormulario();

            }, 700);


        } catch (erro) {

            console.error(
                "Erro ao salvar:",
                erro
            );


            mostrarMensagem(
                "Erro ao salvar a movimentação.",
                true
            );
        }

    }
);


// ==========================================
// EDITAR
// ==========================================

async function editarMovimentacao(id) {

    const movimentacao =
        movimentacoes.find(
            item => item.id === id
        );


    if (!movimentacao) {

        return;
    }


    movimentacaoId.value =
        movimentacao.id;


    tipo.value =
        movimentacao.type;


    status.value =
        movimentacao.status;


    descricao.value =
        movimentacao.description;


    categoria.value =
        movimentacao.category || "";


    valor.value =
        movimentacao.amount;


    dataVencimento.value =
        movimentacao.due_date || "";


    dataPagamento.value =
        movimentacao.payment_date || "";


    observacoes.value =
        movimentacao.notes || "";


    tituloFormulario.textContent =
        "Editar movimentação";


    formularioCard.classList.add(
        "visivel"
    );


    formularioCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// EXCLUIR
// ==========================================

async function excluirMovimentacao(id) {

    const movimentacao =
        movimentacoes.find(
            item => item.id === id
        );


    if (!movimentacao) {

        return;
    }


    const confirmar =
        confirm(
            `Deseja excluir a movimentação "${movimentacao.description}"?`
        );


    if (!confirmar) {

        return;
    }


    try {

        const {
            error
        } = await supabaseClient

            .from("transactions")

            .delete()

            .eq(
                "id",
                id
            )

            .eq(
                "user_id",
                usuarioAtual.id
            );


        if (error) {
            throw error;
        }


        await carregarMovimentacoes();


    } catch (erro) {

        console.error(
            "Erro ao excluir:",
            erro
        );


        mostrarMensagem(
            "Erro ao excluir a movimentação.",
            true
        );
    }
}


// ==========================================
// LIMPAR FORMULÁRIO
// ==========================================

function limparFormulario() {

    formFinanceiro.reset();


    movimentacaoId.value = "";


    tipo.value =
        "Receita";


    status.value =
        "Pendente";


    mensagem.textContent =
        "";

    mensagem.style.color =
        "";
}


// ==========================================
// MENSAGEM
// ==========================================

function mostrarMensagem(
    texto,
    erro = false
) {

    mensagem.textContent =
        texto;


    mensagem.style.color =
        erro
            ? "#ff6b6b"
            : "#35ff88";
}


// ==========================================
// FORMATAR MOEDA
// ==========================================

function formatarMoeda(valor) {

    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    ).format(valor || 0);
}


// ==========================================
// FORMATAR DATA
// ==========================================

function formatarData(data) {

    if (!data) {
        return "-";
    }


    const partes =
        data.split("-");


    if (partes.length !== 3) {
        return data;
    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// ==========================================
// SEGURANÇA HTML
// ==========================================

function escaparHTML(texto) {

    if (texto === null || texto === undefined) {
        return "";
    }


    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// DISPONIBILIZAR FUNÇÕES PARA OS BOTÕES
// ==========================================

window.editarMovimentacao =
    editarMovimentacao;


window.excluirMovimentacao =
    excluirMovimentacao;