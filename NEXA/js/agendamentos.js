// ==========================================
// NEXA - AGENDAMENTOS
// ==========================================

// Elementos da página
const formularioCard = document.getElementById("formularioCard");
const formAgendamento = document.getElementById("formAgendamento");

const agendamentoId = document.getElementById("agendamentoId");

const clienteId = document.getElementById("clienteId");
const servicoId = document.getElementById("servicoId");

const dataAgendamento = document.getElementById("dataAgendamento");
const horaAgendamento = document.getElementById("horaAgendamento");

const statusAgendamento = document.getElementById("statusAgendamento");
const observacoes = document.getElementById("observacoes");

const btnNovoAgendamento = document.getElementById("btnNovoAgendamento");
const btnCancelar = document.getElementById("btnCancelar");
const btnFecharFormulario = document.getElementById("btnFecharFormulario");

const mensagem = document.getElementById("mensagem");

const listaAgendamentos = document.getElementById("listaAgendamentos");
const buscaAgendamento = document.getElementById("buscaAgendamento");

const totalAgendamentos = document.getElementById("totalAgendamentos");
const totalHoje = document.getElementById("totalHoje");
const totalAgendados = document.getElementById("totalAgendados");
const totalConcluidos = document.getElementById("totalConcluidos");


// ==========================================
// VARIÁVEIS
// ==========================================

let usuarioAtual = null;
let agendamentos = [];
let clientes = [];
let servicos = [];


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", iniciar);


async function iniciar() {

    try {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();


        // Usuário não está logado
        if (!session) {
            window.location.href = "login.html";
            return;
        }


        usuarioAtual = session.user;


        // Carrega dados
        await carregarClientes();
        await carregarServicos();
        await carregarAgendamentos();


        // Eventos
        configurarEventos();


    } catch (error) {

        console.error("Erro ao iniciar agendamentos:", error);

        mostrarMensagem(
            "Não foi possível carregar os agendamentos.",
            true
        );
    }
}


// ==========================================
// EVENTOS
// ==========================================

function configurarEventos() {

    // Novo agendamento
    btnNovoAgendamento.addEventListener("click", () => {

        limparFormulario();

        formularioCard.classList.add("visivel");

        formularioCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });


    // Cancelar
    btnCancelar.addEventListener("click", fecharFormulario);


    // Fechar pelo X
    btnFecharFormulario.addEventListener(
        "click",
        fecharFormulario
    );


    // Formulário
    formAgendamento.addEventListener(
        "submit",
        salvarAgendamento
    );


    // Busca
    buscaAgendamento.addEventListener(
        "input",
        filtrarAgendamentos
    );
}


// ==========================================
// FECHAR FORMULÁRIO
// ==========================================

function fecharFormulario() {

    limparFormulario();

    formularioCard.classList.remove("visivel");

}


// ==========================================
// CARREGAR CLIENTES
// ==========================================

async function carregarClientes() {

    const { data, error } = await supabaseClient
        .from("clients")
        .select("id, name")
        .eq("user_id", usuarioAtual.id)
        .order("name", {
            ascending: true
        });


    if (error) {

        console.error("Erro ao carregar clientes:", error);

        throw error;
    }


    clientes = data || [];


    preencherClientes();
}


// ==========================================
// PREENCHER SELECT DE CLIENTES
// ==========================================

function preencherClientes() {

    clienteId.innerHTML = `
        <option value="">
            Selecione um cliente
        </option>
    `;


    clientes.forEach(cliente => {

        const option = document.createElement("option");

        option.value = cliente.id;
        option.textContent = cliente.name;

        clienteId.appendChild(option);

    });

}


// ==========================================
// CARREGAR SERVIÇOS
// ==========================================

async function carregarServicos() {

    const { data, error } = await supabaseClient
        .from("services")
        .select("id, name, price, status")
        .eq("user_id", usuarioAtual.id)
        .order("name", {
            ascending: true
        });


    if (error) {

        console.error("Erro ao carregar serviços:", error);

        throw error;
    }


    servicos = data || [];


    preencherServicos();
}


// ==========================================
// PREENCHER SELECT DE SERVIÇOS
// ==========================================

function preencherServicos() {

    servicoId.innerHTML = `
        <option value="">
            Selecione um serviço
        </option>
    `;


    servicos.forEach(servico => {

        const option = document.createElement("option");

        option.value = servico.id;

        option.textContent =
            `${servico.name} - ${formatarMoeda(servico.price)}`;

        servicoId.appendChild(option);

    });

}


// ==========================================
// CARREGAR AGENDAMENTOS
// ==========================================

async function carregarAgendamentos() {

    const { data, error } = await supabaseClient
        .from("appointments")
        .select(`
            id,
            client_id,
            service_id,
            appointment_date,
            appointment_time,
            notes,
            status,
            created_at,
            clients (
                name
            ),
            services (
                name
            )
        `)
        .eq("user_id", usuarioAtual.id)
        .order("appointment_date", {
            ascending: true
        })
        .order("appointment_time", {
            ascending: true
        });


    if (error) {

        console.error(
            "Erro ao carregar agendamentos:",
            error
        );

        throw error;
    }


    agendamentos = data || [];


    atualizarResumo();

    renderizarAgendamentos();
}


// ==========================================
// ATUALIZAR RESUMO
// ==========================================

function atualizarResumo() {

    const total = agendamentos.length;


    const hoje = obterDataLocal();


    const quantidadeHoje = agendamentos.filter(
        agendamento =>
            agendamento.appointment_date === hoje
    ).length;


    const quantidadeAgendados =
        agendamentos.filter(
            agendamento =>
                agendamento.status === "Agendado"
        ).length;


    const quantidadeConcluidos =
        agendamentos.filter(
            agendamento =>
                agendamento.status === "Concluído"
        ).length;


    totalAgendamentos.textContent = total;

    totalHoje.textContent = quantidadeHoje;

    totalAgendados.textContent = quantidadeAgendados;

    totalConcluidos.textContent = quantidadeConcluidos;
}


// ==========================================
// RENDERIZAR AGENDAMENTOS
// ==========================================

function renderizarAgendamentos(lista = agendamentos) {

    listaAgendamentos.innerHTML = "";


    if (!lista.length) {

        listaAgendamentos.innerHTML = `
            <tr>
                <td colspan="6" class="nenhum-agendamento">
                    Nenhum agendamento encontrado.
                </td>
            </tr>
        `;

        return;
    }


    lista.forEach(agendamento => {

        const tr = document.createElement("tr");


        const cliente =
            agendamento.clients?.name ||
            "Cliente não informado";


        const servico =
            agendamento.services?.name ||
            "Serviço não informado";


        const statusClasse =
            obterClasseStatus(agendamento.status);


        tr.innerHTML = `
            <td>
                ${formatarData(agendamento.appointment_date)}
            </td>

            <td>
                ${formatarHorario(agendamento.appointment_time)}
            </td>

            <td>
                ${escaparHTML(cliente)}
            </td>

            <td>
                ${escaparHTML(servico)}
            </td>

            <td>
                <span class="status ${statusClasse}">
                    ${escaparHTML(agendamento.status)}
                </span>
            </td>

            <td>
                <div class="acoes">

                    <button
                        type="button"
                        class="btn-acao"
                        onclick="editarAgendamento('${agendamento.id}')">
                        Editar
                    </button>

                    <button
                        type="button"
                        class="btn-acao btn-excluir"
                        onclick="excluirAgendamento('${agendamento.id}')">
                        Excluir
                    </button>

                </div>
            </td>
        `;


        listaAgendamentos.appendChild(tr);

    });
}


// ==========================================
// SALVAR AGENDAMENTO
// ==========================================

async function salvarAgendamento(event) {

    event.preventDefault();


    if (!clienteId.value) {

        mostrarMensagem(
            "Selecione um cliente.",
            true
        );

        return;
    }


    if (!servicoId.value) {

        mostrarMensagem(
            "Selecione um serviço.",
            true
        );

        return;
    }


    if (!dataAgendamento.value) {

        mostrarMensagem(
            "Informe a data do agendamento.",
            true
        );

        return;
    }


    if (!horaAgendamento.value) {

        mostrarMensagem(
            "Informe o horário do agendamento.",
            true
        );

        return;
    }


    const dados = {

        user_id: usuarioAtual.id,

        client_id: clienteId.value,

        service_id: servicoId.value,

        appointment_date:
            dataAgendamento.value,

        appointment_time:
            horaAgendamento.value,

        notes:
            observacoes.value.trim() || null,

        status:
            statusAgendamento.value

    };


    const id = agendamentoId.value;


    let error;


    if (id) {

        // ==================================
        // ATUALIZAR
        // ==================================

        const resposta =
            await supabaseClient
                .from("appointments")
                .update(dados)
                .eq("id", id)
                .eq("user_id", usuarioAtual.id);

        error = resposta.error;


    } else {

        // ==================================
        // NOVO
        // ==================================

        const resposta =
            await supabaseClient
                .from("appointments")
                .insert(dados);

        error = resposta.error;
    }


    if (error) {

        console.error(
            "Erro ao salvar agendamento:",
            error
        );

        mostrarMensagem(
            "Erro ao salvar agendamento: " +
            error.message,
            true
        );

        return;
    }


    mostrarMensagem(
        id
            ? "Agendamento atualizado com sucesso!"
            : "Agendamento criado com sucesso!"
    );


    await carregarAgendamentos();


    setTimeout(() => {

        fecharFormulario();

    }, 700);
}


// ==========================================
// EDITAR AGENDAMENTO
// ==========================================

window.editarAgendamento =
    async function(id) {

        const agendamento =
            agendamentos.find(
                item => item.id === id
            );


        if (!agendamento) {
            return;
        }


        agendamentoId.value =
            agendamento.id;


        clienteId.value =
            agendamento.client_id;


        servicoId.value =
            agendamento.service_id;


        dataAgendamento.value =
            agendamento.appointment_date;


        horaAgendamento.value =
            formatarHorarioInput(
                agendamento.appointment_time
            );


        statusAgendamento.value =
            agendamento.status;


        observacoes.value =
            agendamento.notes || "";


        formularioCard.classList.add(
            "visivel"
        );


        formularioCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    };


// ==========================================
// EXCLUIR AGENDAMENTO
// ==========================================

window.excluirAgendamento =
    async function(id) {

        const confirmar =
            confirm(
                "Deseja realmente excluir este agendamento?"
            );


        if (!confirmar) {
            return;
        }


        const { error } =
            await supabaseClient
                .from("appointments")
                .delete()
                .eq("id", id)
                .eq("user_id", usuarioAtual.id);


        if (error) {

            console.error(
                "Erro ao excluir:",
                error
            );

            mostrarMensagem(
                "Erro ao excluir agendamento.",
                true
            );

            return;
        }


        await carregarAgendamentos();

    };


// ==========================================
// BUSCA
// ==========================================

function filtrarAgendamentos() {

    const termo =
        buscaAgendamento.value
            .toLowerCase()
            .trim();


    if (!termo) {

        renderizarAgendamentos(
            agendamentos
        );

        return;
    }


    const filtrados =
        agendamentos.filter(
            agendamento => {

                const cliente =
                    agendamento.clients?.name ||
                    "";


                const servico =
                    agendamento.services?.name ||
                    "";


                return (

                    cliente
                        .toLowerCase()
                        .includes(termo)

                    ||

                    servico
                        .toLowerCase()
                        .includes(termo)

                    ||

                    agendamento.status
                        .toLowerCase()
                        .includes(termo)

                );

            }
        );


    renderizarAgendamentos(
        filtrados
    );
}


// ==========================================
// LIMPAR FORMULÁRIO
// ==========================================

function limparFormulario() {

    formAgendamento.reset();

    agendamentoId.value = "";

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

    mensagem.textContent = texto;

    mensagem.style.color =
        erro
            ? "#ff7777"
            : "#35ff88";

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
// DATA LOCAL
// ==========================================

function obterDataLocal() {

    const agora = new Date();

    const ano =
        agora.getFullYear();


    const mes =
        String(
            agora.getMonth() + 1
        ).padStart(2, "0");


    const dia =
        String(
            agora.getDate()
        ).padStart(2, "0");


    return `${ano}-${mes}-${dia}`;
}


// ==========================================
// FORMATAR HORÁRIO
// ==========================================

function formatarHorario(horario) {

    if (!horario) {
        return "-";
    }


    return horario.substring(0, 5);
}


// ==========================================
// HORÁRIO PARA INPUT
// ==========================================

function formatarHorarioInput(horario) {

    if (!horario) {
        return "";
    }


    return horario.substring(0, 5);
}


// ==========================================
// STATUS
// ==========================================

function obterClasseStatus(status) {

    if (status === "Concluído") {
        return "concluido";
    }


    if (status === "Cancelado") {
        return "cancelado";
    }


    return "";
}


// ==========================================
// MOEDA
// ==========================================

function formatarMoeda(valor) {

    return Number(valor || 0)
        .toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
}


// ==========================================
// SEGURANÇA HTML
// ==========================================

function escaparHTML(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}