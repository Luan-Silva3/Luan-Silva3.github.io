
/* =========================
   ELEMENTOS DO HTML
========================= */

const nomeUsuario = document.getElementById("nomeUsuario");
const nomeBoasVindas = document.getElementById("nomeBoasVindas");
const avatarUsuario = document.getElementById("avatarUsuario");

const btnLogout = document.getElementById("btnLogout");
const btnMenu = document.getElementById("btnMenu");
const sidebar = document.getElementById("sidebar");


/* =========================
   CARREGAR USUÁRIO
========================= */

async function carregarUsuario() {
    try {
        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (!session || !session.user) {
            window.location.replace("login.html");
            return;
        }

        const user = session.user;

        const nome =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Usuário";

        nomeUsuario.textContent = nome;

        nomeBoasVindas.textContent =
            nome.split(" ")[0];

        avatarUsuario.textContent =
            nome.charAt(0).toUpperCase();

            await carregarClientes(user.id);
            await carregarResumoFinanceiro(user.id);
            await carregarResumoServicos(user.id);
            await carregarNotificacoes(user.id);
      
            console.log("Usuário carregado:", user);

    } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        alert("Não foi possível carregar os dados do usuário.");
    }
}


/* =========================
   SAIR DA CONTA
========================= */

btnLogout.addEventListener("click", async function () {
    try {
        btnLogout.disabled = true;
        btnLogout.textContent = "Saindo...";

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.replace("login.html");

    } catch (error) {
        console.error("Erro ao sair:", error);

        alert("Não foi possível sair da conta. Verifique o console.");

        btnLogout.disabled = false;
        btnLogout.innerHTML = "<span>↪</span> Sair da conta";
    }
});


/* =========================
   MENU MOBILE
========================= */

btnMenu.addEventListener("click", function () {
    sidebar.classList.toggle("open");
});


/* =========================
   NAVEGAÇÃO
========================= */

const menuItems =
    document.querySelectorAll(".menu-item");

const pageTitle =
    document.getElementById("pageTitle");

const pageSubtitle =
    document.getElementById("pageSubtitle");

const titulos = {
    dashboard: ["Dashboard", "Visão geral da sua empresa"],
    clientes: ["Clientes", "Gerencie seus clientes"],
    servicos: ["Serviços", "Organize seus serviços"],
    agendamentos: ["Agendamentos", "Acompanhe seus compromissos"],
    produtos: ["Produtos e estoque", "Controle seus produtos"],
    financeiro: ["Financeiro", "Acompanhe suas movimentações"],
    relatorios: ["Relatórios", "Analise os resultados da empresa"],
    configuracoes: ["Configurações", "Personalize sua conta"],
    ajuda: ["Central de ajuda", "Encontre ajuda para utilizar o NEXA"]
};

function selecionarPagina(page) {

    // Atualiza o item ativo do menu
    menuItems.forEach(function (item) {
        item.classList.toggle(
            "active",
            item.dataset.page === page
        );
    });

    // Atualiza título e subtítulo
    if (titulos[page] && pageTitle && pageSubtitle) {
        pageTitle.textContent = titulos[page][0];
        pageSubtitle.textContent = titulos[page][1];
    }

    // Fecha menu no celular
    if (window.innerWidth <= 760 && sidebar) {
        sidebar.classList.remove("open");
    }

    // =========================
    // NAVEGAÇÃO DAS PÁGINAS
    // =========================

    const paginas = {
        dashboard: "dashboard.html",
        clientes: "clientes.html",
        servicos: "servicos.html",
        agendamentos: "agendamentos.html",
        produtos: "produtos.html",
        financeiro: "financeiro.html",
        relatorios: "relatorios.html",
        configuracoes: "configuracoes.html",
        ajuda: "ajuda.html"
    };

    if (paginas[page] && page !== "dashboard") {
        window.location.href = paginas[page];
    }
}

menuItems.forEach(function (item) {

    item.addEventListener("click", function (event) {

        event.preventDefault();

        const page = item.dataset.page;

        selecionarPagina(page);
    });

});


/* =========================
   AÇÕES RÁPIDAS
========================= */

document.querySelectorAll("[data-page]").forEach(function (button) {

    if (button.classList.contains("menu-item")) {
        return;
    }

    button.addEventListener("click", function () {

        const page = button.dataset.page;

        selecionarPagina(page);

    });

});


/* =========================
   DATA ATUAL
========================= */

const dataAtual =
    document.getElementById("dataAtual");

if (dataAtual) {
    dataAtual.textContent =
        new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
}







/* =========================
   INICIAR
========================= */

carregarUsuario();


/* =========================
   CARREGAR CLIENTES
========================= */

async function carregarClientes(userId) {
    const totalClientes = document.getElementById("totalClientes");
    const listaClientes = document.getElementById("listaClientes");

    try {
        const { data: clientes, error, count } =
            await supabaseClient
                .from("clients")
                .select("id, name, phone, email, created_at", {
                    count: "exact"
                })
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(5);

        if (error) {
            throw error;
        }

        // Atualizar o contador
        totalClientes.textContent = count ?? 0;

        // Se não houver clientes cadastrados
        if (!clientes || clientes.length === 0) {
            listaClientes.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-table">
                        Nenhum cliente cadastrado ainda.
                    </td>
                </tr>
            `;
            return;
        }

        // Mostrar os clientes na tabela
        listaClientes.innerHTML = clientes.map(function(cliente) {
            const nome = escaparHTML(cliente.name || "Sem nome");
            const telefone = escaparHTML(cliente.phone || "Não informado");

            return `
                <tr>
                    <td>${nome}</td>
                    <td>${telefone}</td>
                    <td>
                        <span class="client-status">
                            Cadastrado
                        </span>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Erro ao carregar clientes:", error);

        totalClientes.textContent = "—";

        listaClientes.innerHTML = `
            <tr>
                <td colspan="3" class="empty-table">
                    Não foi possível carregar os clientes.
                </td>
            </tr>
        `;
    }
}


/* =========================
   PROTEGER TEXTO HTML
========================= */

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, function(caractere) {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caractere];
    });
}

async function carregarResumoFinanceiro(userId) {
    try {
        const { data, error } = await supabaseClient
            .from("transactions")
            .select("type, amount, status, due_date")
            .eq("user_id", userId);

        if (error) {
            console.error("Erro ao carregar financeiro:", error);
            return;
        }

        let receitas = 0;
        let despesas = 0;

        const hoje = new Date();

        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        data.forEach(transacao => {

            if (transacao.status === "Cancelado") {
                return;
            }

            const valor = Number(transacao.amount) || 0;

            // Se tiver data de vencimento, usamos ela
            if (transacao.due_date) {

                const dataTransacao = new Date(transacao.due_date + "T00:00:00");

                const mes = dataTransacao.getMonth();
                const ano = dataTransacao.getFullYear();

                // Mostrar apenas o mês atual
                if (mes !== mesAtual || ano !== anoAtual) {
                    return;
                }
            }

            if (transacao.type === "Receita") {
                receitas += valor;
            }

            if (transacao.type === "Despesa") {
                despesas += valor;
            }
        });

        const saldo = receitas - despesas;

        const formatarMoeda = valor => {
            return valor.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });
        };

        const receitaElemento = document.getElementById("receitaTotal");
        const despesaElemento = document.getElementById("despesasTotal");
        const saldoElemento = document.getElementById("saldoTotal");

        if (receitaElemento) {
            receitaElemento.textContent = formatarMoeda(receitas);
        }

        if (despesaElemento) {
            despesaElemento.textContent = formatarMoeda(despesas);
        }

        if (saldoElemento) {
            saldoElemento.textContent = formatarMoeda(saldo);
        }

    } catch (erro) {
        console.error("Erro inesperado no financeiro:", erro);
    }
}

async function carregarResumoServicos(userId) {
    try {
        const { data, error } = await supabaseClient
            .from("services")
            .select("status")
            .eq("user_id", userId);

        if (error) {
            throw error;
        }

        const servicosConcluidos = data.filter(
            servico => servico.status === "Concluído"
        ).length;

        const elemento = document.getElementById("totalServicos");

        if (elemento) {
            elemento.textContent = servicosConcluidos;
        }

    } catch (error) {
        console.error("Erro ao carregar serviços:", error);

        const elemento = document.getElementById("totalServicos");

        if (elemento) {
            elemento.textContent = "—";
        }
    }
}

/* =========================
   SISTEMA DE NOTIFICAÇÕES
========================= */

let notificacoesAtuais = [];
let usuarioAtualId = null;

const btnNotificacoes =
    document.getElementById("btnNotificacoes");

const painelNotificacoes =
    document.getElementById("painelNotificacoes");

const listaNotificacoes =
    document.getElementById("listaNotificacoes");

const notificationBadge =
    document.getElementById("notificationBadge");

const notificationSubtitle =
    document.getElementById("notificationSubtitle");

const marcarTodasLidas =
    document.getElementById("marcarTodasLidas");


/* =========================
   ABRIR / FECHAR
========================= */

if (btnNotificacoes) {

    btnNotificacoes.addEventListener("click", function (event) {

        event.stopPropagation();

        painelNotificacoes.classList.toggle("open");

    });

}


/* Fechar ao clicar fora */

document.addEventListener("click", function (event) {

    if (
        painelNotificacoes &&
        !painelNotificacoes.contains(event.target) &&
        !btnNotificacoes.contains(event.target)
    ) {
        painelNotificacoes.classList.remove("open");
    }

});


/* =========================
   GERAR ID DA NOTIFICAÇÃO
========================= */

function criarIdNotificacao(tipo, id) {

    return `${tipo}-${id}`;

}


/* =========================
   CARREGAR NOTIFICAÇÕES
========================= */

async function carregarNotificacoes(userId) {

    try {

        usuarioAtualId = userId;

        const [
            produtosResult,
            agendamentosResult,
            transacoesResult,
            clientesResult,
            servicosResult
        ] = await Promise.all([

            supabaseClient
                .from("products")
                .select("id, name, stock_quantity, minimum_stock, status")
                .eq("user_id", userId),

            supabaseClient
                .from("appointments")
                .select("id, client_id, appointment_date, appointment_time, status")
                .eq("user_id", userId)
                .order("appointment_date", { ascending: true }),

            supabaseClient
                .from("transactions")
                .select("id, description, amount, due_date, status, type")
                .eq("user_id", userId),

            supabaseClient
                .from("clients")
                .select("id, name, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false }),

            supabaseClient
                .from("services")
                .select("id, name, status, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })

        ]);


        if (produtosResult.error) {
            throw produtosResult.error;
        }

        if (agendamentosResult.error) {
            throw agendamentosResult.error;
        }

        if (transacoesResult.error) {
            throw transacoesResult.error;
        }

        if (clientesResult.error) {
            throw clientesResult.error;
        }

        if (servicosResult.error) {
            throw servicosResult.error;
        }


        const produtos = produtosResult.data || [];
        const agendamentos = agendamentosResult.data || [];
        const transacoes = transacoesResult.data || [];
        const clientes = clientesResult.data || [];
        const servicos = servicosResult.data || [];


        const notificacoes = [];


        /* =========================
           ESTOQUE BAIXO
        ========================= */

        produtos.forEach(function (produto) {

            const estoque =
                Number(produto.stock_quantity) || 0;

            const minimo =
                Number(produto.minimum_stock) || 0;

            if (
                produto.status !== "Inativo" &&
                estoque <= minimo
            ) {

                notificacoes.push({

                    id: criarIdNotificacao(
                        "estoque",
                        produto.id
                    ),

                    tipo: "estoque",

                    titulo: "Estoque baixo",

                    mensagem:
                        `${produto.name} está com apenas ${estoque} unidade(s).`,

                    prioridade: 1

                });

            }

        });


        /* =========================
           AGENDAMENTOS PRÓXIMOS
        ========================= */

        const hoje =
            new Date();

        const limiteAgenda =
            new Date();

        limiteAgenda.setDate(
            limiteAgenda.getDate() + 1
        );


        agendamentos.forEach(function (agendamento) {

            if (
                agendamento.status === "Cancelado" ||
                !agendamento.appointment_date
            ) {
                return;
            }


            const dataAgendamento =
                new Date(
                    agendamento.appointment_date +
                    "T00:00:00"
                );


            if (
                dataAgendamento >= hoje &&
                dataAgendamento <= limiteAgenda
            ) {

                const dataFormatada =
                    dataAgendamento.toLocaleDateString(
                        "pt-BR"
                    );


                const horario =
                    agendamento.appointment_time
                    ? agendamento.appointment_time.substring(0, 5)
                    : "";


                notificacoes.push({

                    id: criarIdNotificacao(
                        "agendamento",
                        agendamento.id
                    ),

                    tipo: "agendamento",

                    titulo: "Agendamento próximo",

                    mensagem:
                        `Você possui um agendamento em ${dataFormatada}${horario ? ` às ${horario}` : ""}.`,

                    prioridade: 2

                });

            }

        });


        /* =========================
           TRANSAÇÕES PENDENTES
        ========================= */

        transacoes.forEach(function (transacao) {

            if (
                transacao.status === "Cancelado" ||
                transacao.status === "Pago" ||
                transacao.status === "Concluído"
            ) {
                return;
            }


            if (!transacao.due_date) {
                return;
            }


            const vencimento =
                new Date(
                    transacao.due_date +
                    "T00:00:00"
                );


            if (vencimento <= hoje) {

                const valor =
                    Number(transacao.amount) || 0;


                const valorFormatado =
                    valor.toLocaleString(
                        "pt-BR",
                        {
                            style: "currency",
                            currency: "BRL"
                        }
                    );


                notificacoes.push({

                    id: criarIdNotificacao(
                        "financeiro",
                        transacao.id
                    ),

                    tipo: "financeiro",

                    titulo: "Transação pendente",

                    mensagem:
                        `${transacao.description || "Movimentação"} — ${valorFormatado}.`,

                    prioridade: 1

                });

            }

        });


        /* =========================
           CLIENTES NOVOS
        ========================= */

        const limiteCliente =
            new Date();

        limiteCliente.setHours(
            limiteCliente.getHours() - 24
        );


        clientes.forEach(function (cliente) {

            if (!cliente.created_at) {
                return;
            }


            const criadoEm =
                new Date(cliente.created_at);


            if (criadoEm >= limiteCliente) {

                notificacoes.push({

                    id: criarIdNotificacao(
                        "cliente",
                        cliente.id
                    ),

                    tipo: "cliente",

                    titulo: "Novo cliente",

                    mensagem:
                        `${cliente.name || "Um novo cliente"} foi cadastrado recentemente.`,

                    prioridade: 3

                });

            }

        });


        /* =========================
           SERVIÇOS EM ANDAMENTO
        ========================= */

        servicos.forEach(function (servico) {

            if (
                servico.status === "Em andamento"
            ) {

                notificacoes.push({

                    id: criarIdNotificacao(
                        "servico",
                        servico.id
                    ),

                    tipo: "servico",

                    titulo: "Serviço em andamento",

                    mensagem:
                        `${servico.name || "Um serviço"} está em andamento.`,

                    prioridade: 4

                });

            }

        });


        /* =========================
           ORDENAR
        ========================= */

        notificacoes.sort(function (a, b) {

            return a.prioridade - b.prioridade;

        });


        notificacoesAtuais =
            notificacoes;


        renderizarNotificacoes();


    } catch (error) {

        console.error(
            "Erro ao carregar notificações:",
            error
        );

    }

}


/* =========================
   NOTIFICAÇÕES LIDAS
========================= */

function obterNotificacoesLidas() {

    if (!usuarioAtualId) {
        return [];
    }

    const chave =
        `nexa-notificacoes-lidas-${usuarioAtualId}`;

    try {

        return JSON.parse(
            localStorage.getItem(chave)
        ) || [];

    } catch {

        return [];

    }

}


function salvarNotificacoesLidas(lista) {

    const chave =
        `nexa-notificacoes-lidas-${usuarioAtualId}`;

    localStorage.setItem(
        chave,
        JSON.stringify(lista)
    );

}


/* =========================
   RENDERIZAR
========================= */

function renderizarNotificacoes() {

    if (!listaNotificacoes) {
        return;
    }


    const lidas =
        obterNotificacoesLidas();


    const naoLidas =
        notificacoesAtuais.filter(
            notificacao =>
                !lidas.includes(notificacao.id)
        );


    /* Badge */

    if (notificationBadge) {

        notificationBadge.textContent =
            naoLidas.length > 99
                ? "99+"
                : naoLidas.length;

        notificationBadge.style.display =
            naoLidas.length > 0
                ? "flex"
                : "none";

    }


    /* Texto */

    if (notificationSubtitle) {

        notificationSubtitle.textContent =
            naoLidas.length === 0
                ? "Tudo em dia"
                : `${naoLidas.length} nova(s) notificação(ões)`;

    }


    /* Nenhuma */

    if (notificacoesAtuais.length === 0) {

        listaNotificacoes.innerHTML = `

            <div class="notification-empty">

                <span>✓</span>

                <strong>Tudo certo por aqui</strong>

                <p>
                    Você não possui novas notificações.
                </p>

            </div>

        `;

        return;

    }


    listaNotificacoes.innerHTML =
        notificacoesAtuais.map(function (notificacao) {

            const lida =
                lidas.includes(notificacao.id);


            return `

                <div
                    class="notification-dropdown-item ${lida ? "read" : "unread"}"
                    data-notification-id="${escaparHTML(notificacao.id)}"
                >

                    <span class="notification-type-icon">
                        ${obterIconeNotificacao(notificacao.tipo)}
                    </span>

                    <div class="notification-content">

                        <strong>
                            ${escaparHTML(notificacao.titulo)}
                        </strong>

                        <p>
                            ${escaparHTML(notificacao.mensagem)}
                        </p>

                    </div>

                    ${
                        !lida
                        ? `<span class="notification-unread-dot"></span>`
                        : ""
                    }

                </div>

            `;

        }).join("");


    /* Clique para marcar individualmente */

    document
        .querySelectorAll(".notification-dropdown-item")
        .forEach(function (item) {

            item.addEventListener(
                "click",
                function () {

                    const id =
                        item.dataset.notificationId;

                    marcarNotificacaoComoLida(id);

                }
            );

        });

}


/* =========================
   ÍCONES
========================= */

function obterIconeNotificacao(tipo) {

    const icones = {

        estoque: "📦",

        agendamento: "📅",

        financeiro: "💰",

        cliente: "👤",

        servico: "🔧"

    };

    return icones[tipo] || "🔔";

}


/* =========================
   MARCAR COMO LIDA
========================= */

function marcarNotificacaoComoLida(id) {

    const lidas =
        obterNotificacoesLidas();


    if (!lidas.includes(id)) {

        lidas.push(id);

        salvarNotificacoesLidas(lidas);

    }


    renderizarNotificacoes();

}


/* =========================
   MARCAR TODAS
========================= */

if (marcarTodasLidas) {

    marcarTodasLidas.addEventListener(
        "click",
        function () {

            const ids =
                notificacoesAtuais.map(
                    notificacao => notificacao.id
                );


            salvarNotificacoesLidas(ids);

            renderizarNotificacoes();

        }
    );

}