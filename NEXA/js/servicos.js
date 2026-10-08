/* =========================
   NEXA — SERVIÇOS
========================= */


/* =========================
   ELEMENTOS
========================= */

const formularioCard = document.getElementById("formularioCard");
const formServico = document.getElementById("formServico");

const btnNovoServico = document.getElementById("btnNovoServico");
const btnCancelar = document.getElementById("btnCancelar");
const btnSalvar = document.getElementById("btnSalvar");

const servicoId = document.getElementById("servicoId");

const clienteId = document.getElementById("clienteId");
const nomeServico = document.getElementById("nomeServico");
const valor = document.getElementById("valor");
const status = document.getElementById("status");
const descricao = document.getElementById("descricao");

const buscaServico = document.getElementById("buscaServico");
const listaServicos = document.getElementById("listaServicos");

const totalServicos = document.getElementById("totalServicos");
const totalAndamento = document.getElementById("totalAndamento");
const totalConcluidos = document.getElementById("totalConcluidos");

const tituloFormulario = document.getElementById("tituloFormulario");
const mensagem = document.getElementById("mensagem");


/* =========================
   VARIÁVEIS
========================= */

let usuarioAtual = null;
let servicos = [];
let clientes = [];


/* =========================
   INICIAR
========================= */

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

        if (!session || !session.user) {
            window.location.replace("login.html");
            return;
        }

        usuarioAtual = session.user;

        await carregarClientes();
        await carregarServicos();

    } catch (error) {

        console.error("Erro ao iniciar página:", error);

        mostrarMensagem(
            "Não foi possível carregar os dados.",
            "erro"
        );

    }

}


/* =========================
   CARREGAR CLIENTES
========================= */

async function carregarClientes() {

    const { data, error } = await supabaseClient
        .from("clients")
        .select("id, name")
        .eq("user_id", usuarioAtual.id)
        .order("name", { ascending: true });

    if (error) {
        throw error;
    }

    clientes = data || [];

    clienteId.innerHTML = `
        <option value="">
            Selecione um cliente
        </option>
    `;

    clientes.forEach(function(cliente) {

        const option = document.createElement("option");

        option.value = cliente.id;
        option.textContent = cliente.name;

        clienteId.appendChild(option);

    });

}


/* =========================
   CARREGAR SERVIÇOS
========================= */

async function carregarServicos() {

    const { data, error } = await supabaseClient
        .from("services")
        .select(`
            id,
            client_id,
            name,
            description,
            price,
            status,
            created_at,
            clients (
                name
            )
        `)
        .eq("user_id", usuarioAtual.id)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    servicos = data || [];

    atualizarResumo();

    renderizarServicos();

}


/* =========================
   RESUMO
========================= */

function atualizarResumo() {

    totalServicos.textContent = servicos.length;

    const andamento = servicos.filter(function(servico) {

        return servico.status === "Em andamento";

    });

    const concluidos = servicos.filter(function(servico) {

        return servico.status === "Concluído";

    });

    totalAndamento.textContent = andamento.length;

    totalConcluidos.textContent = concluidos.length;

}


/* =========================
   RENDERIZAR SERVIÇOS
========================= */

function renderizarServicos(lista = servicos) {

    if (!lista.length) {

        listaServicos.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    Nenhum serviço cadastrado ainda.
                </td>
            </tr>
        `;

        return;
    }


    listaServicos.innerHTML = lista.map(function(servico) {

        const nome = escaparHTML(
            servico.name || "Sem nome"
        );

        const cliente = escaparHTML(
            servico.clients?.name || "Cliente não informado"
        );

        const valorServico = formatarMoeda(
            servico.price
        );

        const statusTexto = escaparHTML(
            servico.status || "Em andamento"
        );

        let classeStatus = "";

        if (servico.status === "Concluído") {
            classeStatus = "concluido";
        }

        if (servico.status === "Cancelado") {
            classeStatus = "cancelado";
        }


        return `
            <tr>

                <td>
                    ${nome}
                </td>

                <td>
                    ${cliente}
                </td>

                <td>
                    ${valorServico}
                </td>

                <td>
                    <span class="status ${classeStatus}">
                        ${statusTexto}
                    </span>
                </td>

                <td>

                    <div class="acoes">

                        <button
                            type="button"
                            class="btn-acao"
                            onclick="editarServico('${servico.id}')"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            class="btn-acao btn-excluir"
                            onclick="excluirServico('${servico.id}')"
                        >
                            Excluir
                        </button>

                    </div>

                </td>

            </tr>
        `;

    }).join("");

}


/* =========================
   NOVO SERVIÇO
========================= */

btnNovoServico.addEventListener("click", function() {

    limparFormulario();

    tituloFormulario.textContent = "Novo serviço";

    formularioCard.classList.add("visivel");

    formularioCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});


/* =========================
   CANCELAR
========================= */

btnCancelar.addEventListener("click", function() {

    limparFormulario();

    formularioCard.classList.remove("visivel");

});


/* =========================
   SALVAR
========================= */

formServico.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!usuarioAtual) {
        return;
    }

    btnSalvar.disabled = true;

    btnSalvar.textContent = "Salvando...";

    mensagem.textContent = "";


    try {

        const dados = {

            user_id: usuarioAtual.id,

            client_id: clienteId.value,

            name: nomeServico.value.trim(),

            description: descricao.value.trim(),

            price: Number(valor.value) || 0,

            status: status.value

        };


        if (!dados.client_id) {

            mostrarMensagem(
                "Selecione um cliente.",
                "erro"
            );

            return;
        }


        if (!dados.name) {

            mostrarMensagem(
                "Informe o nome do serviço.",
                "erro"
            );

            return;
        }


        /* =========================
           EDITAR
        ========================= */

        if (servicoId.value) {

            const { error } = await supabaseClient
                .from("services")
                .update(dados)
                .eq("id", servicoId.value)
                .eq("user_id", usuarioAtual.id);

            if (error) {
                throw error;
            }

            mostrarMensagem(
                "Serviço atualizado com sucesso!",
                "sucesso"
            );

        }

        /* =========================
           NOVO
        ========================= */

        else {

            const { error } = await supabaseClient
                .from("services")
                .insert(dados);

            if (error) {
                throw error;
            }

            mostrarMensagem(
                "Serviço cadastrado com sucesso!",
                "sucesso"
            );

        }


        await carregarServicos();

        setTimeout(function() {

            limparFormulario();

            formularioCard.classList.remove("visivel");

        }, 700);


    } catch (error) {

        console.error("Erro ao salvar serviço:", error);

        mostrarMensagem(
            "Não foi possível salvar o serviço.",
            "erro"
        );

    } finally {

        btnSalvar.disabled = false;

        btnSalvar.textContent = "Salvar serviço";

    }

});


/* =========================
   EDITAR SERVIÇO
========================= */

window.editarServico = function(id) {

    const servico = servicos.find(function(item) {

        return item.id === id;

    });

    if (!servico) {
        return;
    }

    servicoId.value = servico.id;

    clienteId.value = servico.client_id || "";

    nomeServico.value = servico.name || "";

    valor.value = servico.price || "";

    status.value = servico.status || "Em andamento";

    descricao.value = servico.description || "";

    tituloFormulario.textContent = "Editar serviço";

    mensagem.textContent = "";

    formularioCard.classList.add("visivel");

    formularioCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

};


/* =========================
   EXCLUIR SERVIÇO
========================= */

window.excluirServico = async function(id) {

    const confirmar = confirm(
        "Tem certeza que deseja excluir este serviço?"
    );

    if (!confirmar) {
        return;
    }


    try {

        const { error } = await supabaseClient
            .from("services")
            .delete()
            .eq("id", id)
            .eq("user_id", usuarioAtual.id);

        if (error) {
            throw error;
        }

        await carregarServicos();

    } catch (error) {

        console.error("Erro ao excluir serviço:", error);

        alert(
            "Não foi possível excluir o serviço."
        );

    }

};


/* =========================
   PESQUISA
========================= */

buscaServico.addEventListener("input", function() {

    const termo = buscaServico.value
        .toLowerCase()
        .trim();

    if (!termo) {

        renderizarServicos();

        return;
    }


    const resultado = servicos.filter(function(servico) {

        const nomeServico = (
            servico.name || ""
        ).toLowerCase();

        const nomeCliente = (
            servico.clients?.name || ""
        ).toLowerCase();

        return (
            nomeServico.includes(termo) ||
            nomeCliente.includes(termo)
        );

    });


    renderizarServicos(resultado);

});


/* =========================
   LIMPAR FORMULÁRIO
========================= */

function limparFormulario() {

    formServico.reset();

    servicoId.value = "";

    status.value = "Em andamento";

    tituloFormulario.textContent = "Novo serviço";

    mensagem.textContent = "";

}


/* =========================
   MENSAGEM
========================= */

function mostrarMensagem(texto, tipo) {

    mensagem.textContent = texto;

    mensagem.style.color =
        tipo === "erro"
            ? "#ff7070"
            : "#35ff88";

}


/* =========================
   MOEDA
========================= */

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


/* =========================
   PROTEGER HTML
========================= */

function escaparHTML(valor) {

    return String(valor).replace(
        /[&<>"']/g,
        function(caractere) {

            const entidades = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"

            };

            return entidades[caractere];

        }
    );

}