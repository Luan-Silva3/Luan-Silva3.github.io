
const formCliente = document.getElementById("formCliente");
const btnSalvar = document.getElementById("btnSalvar");
const btnNovoCliente = document.getElementById("btnNovoCliente");
const btnCancelar = document.getElementById("btnCancelar");

const formularioCard = document.getElementById("formularioCard");
const tituloFormulario = document.getElementById("tituloFormulario");

const listaClientes = document.getElementById("listaClientes");
const totalClientes = document.getElementById("totalClientes");
const buscaCliente = document.getElementById("buscaCliente");
const mensagem = document.getElementById("mensagem");

let usuarioAtual = null;
let clientes = [];


/* =========================
   VERIFICAR USUÁRIO
========================= */

async function verificarUsuario() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.replace("login.html");
        return null;
    }

    return data.user;
}


/* =========================
   MOSTRAR MENSAGEM
========================= */

function mostrarMensagem(texto, tipo) {
    mensagem.className = "mensagem " + tipo;
    mensagem.textContent = texto;
}


/* =========================
   ABRIR FORMULÁRIO
========================= */

function abrirFormulario(cliente = null) {
    formularioCard.classList.add("aberto");

    formCliente.reset();

    document.getElementById("clienteId").value =
        cliente ? cliente.id : "";

    document.getElementById("nome").value =
        cliente ? cliente.name || "" : "";

    document.getElementById("telefone").value =
        cliente ? cliente.phone || "" : "";

    document.getElementById("email").value =
        cliente ? cliente.email || "" : "";

    document.getElementById("observacoes").value =
        cliente ? cliente.notes || "" : "";

    tituloFormulario.textContent =
        cliente ? "Editar cliente" : "Novo cliente";

    btnSalvar.textContent =
        cliente ? "Salvar alterações" : "Salvar cliente";

    mensagem.className = "mensagem";

    formularioCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================
   FECHAR FORMULÁRIO
========================= */

function fecharFormulario() {
    formularioCard.classList.remove("aberto");
    formCliente.reset();
    mensagem.className = "mensagem";
}


/* =========================
   CARREGAR CLIENTES
========================= */

async function carregarClientes() {
    listaClientes.innerHTML = `
        <tr>
            <td colspan="4">Carregando clientes...</td>
        </tr>
    `;

    try {
        const { data, error } = await supabaseClient
            .from("clients")
            .select("id, name, phone, email, notes, created_at")
            .eq("user_id", usuarioAtual.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        clientes = data || [];

        totalClientes.textContent = clientes.length;

        renderizarClientes(clientes);

    } catch (error) {
        console.error(error);

        listaClientes.innerHTML = `
            <tr>
                <td colspan="4">
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


/* =========================
   RENDERIZAR CLIENTES
========================= */

function renderizarClientes(lista) {
    if (lista.length === 0) {
        listaClientes.innerHTML = `
            <tr>
                <td colspan="4">
                    Nenhum cliente encontrado.
                </td>
            </tr>
        `;

        return;
    }

    listaClientes.innerHTML = lista.map(function(cliente) {
        return `
            <tr>
                <td>${escaparHTML(cliente.name || "Sem nome")}</td>
                <td>${escaparHTML(cliente.phone || "Não informado")}</td>
                <td>${escaparHTML(cliente.email || "Não informado")}</td>
                <td>
                    <button
                        class="btn-editar"
                        data-editar="${escaparHTML(cliente.id)}"
                    >
                        Editar
                    </button>

                    <button
                        class="btn-excluir"
                        data-excluir="${escaparHTML(cliente.id)}"
                    >
                        Excluir
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}


/* =========================
   PESQUISAR CLIENTES
========================= */

buscaCliente.addEventListener("input", function() {
    const termo = buscaCliente.value
        .trim()
        .toLowerCase();

    const filtrados = clientes.filter(function(cliente) {
        return (
            (cliente.name || "").toLowerCase().includes(termo) ||
            (cliente.phone || "").toLowerCase().includes(termo) ||
            (cliente.email || "").toLowerCase().includes(termo)
        );
    });

    renderizarClientes(filtrados);
});


/* =========================
   BOTÃO NOVO CLIENTE
========================= */

btnNovoCliente.addEventListener("click", function() {
    abrirFormulario();
});


/* =========================
   BOTÃO CANCELAR
========================= */

btnCancelar.addEventListener("click", fecharFormulario);


/* =========================
   SALVAR OU EDITAR
========================= */

formCliente.addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("clienteId").value;

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();
    const observacoes = document.getElementById("observacoes").value.trim();

    if (!nome) {
        mostrarMensagem("Digite o nome do cliente.", "erro");
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    try {
        let resultado;

        if (id) {
            resultado = await supabaseClient
                .from("clients")
                .update({
                    name: nome,
                    phone: telefone || null,
                    email: email || null,
                    notes: observacoes || null
                })
                .eq("id", id)
                .eq("user_id", usuarioAtual.id);
        } else {
            resultado = await supabaseClient
                .from("clients")
                .insert({
                    user_id: usuarioAtual.id,
                    name: nome,
                    phone: telefone || null,
                    email: email || null,
                    notes: observacoes || null
                });
        }

        if (resultado.error) {
            throw resultado.error;
        }

        mostrarMensagem(
            id
                ? "Cliente atualizado com sucesso!"
                : "Cliente cadastrado com sucesso!",
            "sucesso"
        );

        await carregarClientes();

        formCliente.reset();

        setTimeout(function() {
            fecharFormulario();
        }, 800);

    } catch (error) {
        console.error(error);

        mostrarMensagem(
            error.message || "Erro ao salvar cliente.",
            "erro"
        );

    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = id
            ? "Salvar alterações"
            : "Salvar cliente";
    }
});


/* =========================
   EDITAR E EXCLUIR
========================= */

listaClientes.addEventListener("click", async function(event) {
    const botaoEditar = event.target.closest("[data-editar]");
    const botaoExcluir = event.target.closest("[data-excluir]");

    if (botaoEditar) {
        const cliente = clientes.find(function(item) {
            return String(item.id) === botaoEditar.dataset.editar;
        });

        if (cliente) {
            abrirFormulario(cliente);
        }
    }

    if (botaoExcluir) {
        const id = botaoExcluir.dataset.excluir;

        const confirmar = confirm(
            "Tem certeza que deseja excluir este cliente?"
        );

        if (!confirmar) {
            return;
        }

        try {
            const { error } = await supabaseClient
                .from("clients")
                .delete()
                .eq("id", id)
                .eq("user_id", usuarioAtual.id);

            if (error) {
                throw error;
            }

            await carregarClientes();

        } catch (error) {
            console.error(error);
            alert("Não foi possível excluir o cliente.");
        }
    }
});


/* =========================
   INICIAR SISTEMA
========================= */

async function iniciarClientes() {
    usuarioAtual = await verificarUsuario();

    if (!usuarioAtual) {
        return;
    }

    await carregarClientes();
}

iniciarClientes();