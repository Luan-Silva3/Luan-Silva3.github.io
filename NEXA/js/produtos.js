// ==========================================
// NEXA - PRODUTOS E ESTOQUE
// ==========================================

// Elementos
const formularioCard = document.getElementById("formularioCard");
const formProduto = document.getElementById("formProduto");

const produtoId = document.getElementById("produtoId");

const nomeProduto = document.getElementById("nomeProduto");
const codigoProduto = document.getElementById("codigoProduto");
const categoriaProduto = document.getElementById("categoriaProduto");

const precoCusto = document.getElementById("precoCusto");
const precoVenda = document.getElementById("precoVenda");

const estoqueAtual = document.getElementById("estoqueAtual");
const estoqueMinimo = document.getElementById("estoqueMinimo");

const statusProduto = document.getElementById("statusProduto");
const descricaoProduto = document.getElementById("descricaoProduto");

const btnNovoProduto = document.getElementById("btnNovoProduto");
const btnCancelar = document.getElementById("btnCancelar");
const btnFecharFormulario =
    document.getElementById("btnFecharFormulario");

const mensagem = document.getElementById("mensagem");

const listaProdutos = document.getElementById("listaProdutos");
const buscaProduto = document.getElementById("buscaProduto");

const totalProdutos =
    document.getElementById("totalProdutos");

const totalAtivos =
    document.getElementById("totalAtivos");

const totalEstoqueBaixo =
    document.getElementById("totalEstoqueBaixo");

const valorEstoque =
    document.getElementById("valorEstoque");


// ==========================================
// VARIÁVEIS
// ==========================================

let usuarioAtual = null;
let produtos = [];


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);


async function iniciar() {

    try {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();


        // Verifica login
        if (!session) {

            window.location.href =
                "login.html";

            return;
        }


        usuarioAtual = session.user;


        // Carrega produtos
        await carregarProdutos();


        // Eventos
        configurarEventos();


    } catch (error) {

        console.error(
            "Erro ao iniciar produtos:",
            error
        );

        mostrarMensagem(
            "Não foi possível carregar os produtos.",
            true
        );
    }
}


// ==========================================
// EVENTOS
// ==========================================

function configurarEventos() {


    // Novo produto
    btnNovoProduto.addEventListener(
        "click",
        () => {

            limparFormulario();

            formularioCard.classList.add(
                "visivel"
            );

            formularioCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );


    // Cancelar
    btnCancelar.addEventListener(
        "click",
        fecharFormulario
    );


    // Fechar X
    btnFecharFormulario.addEventListener(
        "click",
        fecharFormulario
    );


    // Formulário
    formProduto.addEventListener(
        "submit",
        salvarProduto
    );


    // Busca
    buscaProduto.addEventListener(
        "input",
        filtrarProdutos
    );
}


// ==========================================
// FECHAR FORMULÁRIO
// ==========================================

function fecharFormulario() {

    limparFormulario();

    formularioCard.classList.remove(
        "visivel"
    );
}


// ==========================================
// CARREGAR PRODUTOS
// ==========================================

async function carregarProdutos() {

    const { data, error } =
        await supabaseClient
            .from("products")
            .select(`
                id,
                name,
                category,
                code,
                description,
                cost_price,
                sale_price,
                stock_quantity,
                minimum_stock,
                status,
                created_at
            `)
            .eq(
                "user_id",
                usuarioAtual.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );

        throw error;
    }


    produtos = data || [];


    atualizarResumo();

    renderizarProdutos();
}


// ==========================================
// ATUALIZAR RESUMO
// ==========================================

function atualizarResumo() {

    // Total
    totalProdutos.textContent =
        produtos.length;


    // Ativos
    const ativos =
        produtos.filter(
            produto =>
                produto.status === "Ativo"
        ).length;


    totalAtivos.textContent =
        ativos;


    // Estoque baixo
    const estoqueBaixo =
        produtos.filter(
            produto =>
                Number(
                    produto.stock_quantity
                ) <=
                Number(
                    produto.minimum_stock
                )
        ).length;


    totalEstoqueBaixo.textContent =
        estoqueBaixo;


    // Valor total do estoque
    const valorTotal =
        produtos.reduce(
            (total, produto) => {

                const quantidade =
                    Number(
                        produto.stock_quantity
                    ) || 0;


                const custo =
                    Number(
                        produto.cost_price
                    ) || 0;


                return total +
                    (quantidade * custo);

            },
            0
        );


    valorEstoque.textContent =
        formatarMoeda(valorTotal);
}


// ==========================================
// RENDERIZAR PRODUTOS
// ==========================================

function renderizarProdutos(
    lista = produtos
) {

    listaProdutos.innerHTML = "";


    if (!lista.length) {

        listaProdutos.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="nenhum-produto">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;

        return;
    }


    lista.forEach(produto => {

        const tr =
            document.createElement("tr");


        // Estoque
        const quantidade =
            Number(
                produto.stock_quantity
            ) || 0;


        const minimo =
            Number(
                produto.minimum_stock
            ) || 0;


        let classeEstoque = "";
        let textoEstoque = quantidade;


        if (quantidade === 0) {

            classeEstoque =
                "sem-estoque";

            textoEstoque =
                "Sem estoque";


        } else if (quantidade <= minimo) {

            classeEstoque =
                "baixo";

            textoEstoque =
                `${quantidade} un.`;


        } else {

            textoEstoque =
                `${quantidade} un.`;
        }


        // Status
        const classeStatus =
            produto.status === "Ativo"
                ? "ativo"
                : "inativo";


        tr.innerHTML = `

            <td>

                <div class="produto-nome">
                    ${escaparHTML(
                        produto.name
                    )}
                </div>

                ${
                    produto.description
                        ? `
                            <span class="produto-descricao">
                                ${escaparHTML(
                                    produto.description
                                )}
                            </span>
                          `
                        : ""
                }

            </td>


            <td>
                ${
                    escaparHTML(
                        produto.code || "-"
                    )
                }
            </td>


            <td>
                ${
                    escaparHTML(
                        produto.category || "-"
                    )
                }
            </td>


            <td>
                ${formatarMoeda(
                    produto.sale_price
                )}
            </td>


            <td>

                <span
                    class="estoque ${classeEstoque}">
                    ${textoEstoque}
                </span>

            </td>


            <td>

                <span
                    class="status ${classeStatus}">
                    ${escaparHTML(
                        produto.status
                    )}
                </span>

            </td>


            <td>

                <div class="acoes">

                    <button
                        type="button"
                        class="btn-acao"
                        onclick="editarProduto('${produto.id}')">
                        Editar
                    </button>


                    <button
                        type="button"
                        class="btn-acao btn-excluir"
                        onclick="excluirProduto('${produto.id}')">
                        Excluir
                    </button>

                </div>

            </td>

        `;


        listaProdutos.appendChild(tr);

    });
}


// ==========================================
// SALVAR PRODUTO
// ==========================================

async function salvarProduto(event) {

    event.preventDefault();


    // Valida nome
    if (!nomeProduto.value.trim()) {

        mostrarMensagem(
            "Informe o nome do produto.",
            true
        );

        return;
    }


    // Converte valores
    const custo =
        Number(
            precoCusto.value
        ) || 0;


    const venda =
        Number(
            precoVenda.value
        ) || 0;


    const estoque =
        Number(
            estoqueAtual.value
        ) || 0;


    const minimo =
        Number(
            estoqueMinimo.value
        ) || 0;


    // Dados
    const dados = {

        user_id:
            usuarioAtual.id,

        name:
            nomeProduto.value.trim(),

        category:
            categoriaProduto.value.trim()
            || null,

        code:
            codigoProduto.value.trim()
            || null,

        description:
            descricaoProduto.value.trim()
            || null,

        cost_price:
            custo,

        sale_price:
            venda,

        stock_quantity:
            estoque,

        minimum_stock:
            minimo,

        status:
            statusProduto.value
    };


    const id =
        produtoId.value;


    let error;


    // ======================================
    // ATUALIZAR
    // ======================================

    if (id) {

        const resposta =
            await supabaseClient
                .from("products")
                .update(dados)
                .eq("id", id)
                .eq(
                    "user_id",
                    usuarioAtual.id
                );


        error =
            resposta.error;


    } else {

        // ==================================
        // NOVO
        // ==================================

        const resposta =
            await supabaseClient
                .from("products")
                .insert(dados);


        error =
            resposta.error;
    }


    // Erro
    if (error) {

        console.error(
            "Erro ao salvar produto:",
            error
        );

        mostrarMensagem(
            "Erro ao salvar produto: " +
            error.message,
            true
        );

        return;
    }


    mostrarMensagem(
        id
            ? "Produto atualizado com sucesso!"
            : "Produto cadastrado com sucesso!"
    );


    // Atualiza lista
    await carregarProdutos();


    // Fecha formulário
    setTimeout(
        () => {
            fecharFormulario();
        },
        700
    );
}


// ==========================================
// EDITAR PRODUTO
// ==========================================

window.editarProduto =
    function(id) {

        const produto =
            produtos.find(
                item =>
                    item.id === id
            );


        if (!produto) {
            return;
        }


        produtoId.value =
            produto.id;


        nomeProduto.value =
            produto.name || "";


        codigoProduto.value =
            produto.code || "";


        categoriaProduto.value =
            produto.category || "";


        precoCusto.value =
            produto.cost_price ?? 0;


        precoVenda.value =
            produto.sale_price ?? 0;


        estoqueAtual.value =
            produto.stock_quantity ?? 0;


        estoqueMinimo.value =
            produto.minimum_stock ?? 0;


        statusProduto.value =
            produto.status || "Ativo";


        descricaoProduto.value =
            produto.description || "";


        formularioCard.classList.add(
            "visivel"
        );


        formularioCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };


// ==========================================
// EXCLUIR PRODUTO
// ==========================================

window.excluirProduto =
    async function(id) {

        const confirmar =
            confirm(
                "Deseja realmente excluir este produto?"
            );


        if (!confirmar) {
            return;
        }


        const { error } =
            await supabaseClient
                .from("products")
                .delete()
                .eq("id", id)
                .eq(
                    "user_id",
                    usuarioAtual.id
                );


        if (error) {

            console.error(
                "Erro ao excluir produto:",
                error
            );

            mostrarMensagem(
                "Erro ao excluir produto.",
                true
            );

            return;
        }


        await carregarProdutos();
    };


// ==========================================
// BUSCAR PRODUTOS
// ==========================================

function filtrarProdutos() {

    const termo =
        buscaProduto.value
            .toLowerCase()
            .trim();


    if (!termo) {

        renderizarProdutos(
            produtos
        );

        return;
    }


    const filtrados =
        produtos.filter(
            produto => {

                const nome =
                    produto.name || "";


                const codigo =
                    produto.code || "";


                const categoria =
                    produto.category || "";


                return (

                    nome
                        .toLowerCase()
                        .includes(termo)

                    ||

                    codigo
                        .toLowerCase()
                        .includes(termo)

                    ||

                    categoria
                        .toLowerCase()
                        .includes(termo)

                );
            }
        );


    renderizarProdutos(
        filtrados
    );
}


// ==========================================
// LIMPAR FORMULÁRIO
// ==========================================

function limparFormulario() {

    formProduto.reset();


    produtoId.value = "";


    estoqueAtual.value = 0;

    estoqueMinimo.value = 0;

    statusProduto.value =
        "Ativo";


    mensagem.textContent = "";

    mensagem.style.color = "";
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
            ? "#ff7777"
            : "#35ff88";
}


// ==========================================
// MOEDA
// ==========================================

function formatarMoeda(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}


// ==========================================
// SEGURANÇA HTML
// ==========================================

function escaparHTML(texto) {

    return String(
        texto ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}