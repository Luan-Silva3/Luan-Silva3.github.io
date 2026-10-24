
const buscaEmpresa = document.querySelector("#buscaEmpresa");
const filtroCategoria = document.querySelector("#filtroCategoria");
const listaEmpresas = document.querySelector("#listaEmpresas");
const mensagem = document.querySelector("#mensagem");
const totalEmpresas = document.querySelector("#totalEmpresas");

let estabelecimentos = [];
let servicos = [];

async function carregarEmpresas() {
    mensagem.textContent = "Carregando estabelecimentos...";
    totalEmpresas.textContent = "";

    const { data: empresas, error: erroEmpresas } = await supabaseClient
        .from("estabelecimentos")
        .select("id, nome, categoria")
        .order("nome");

    if (erroEmpresas) {
        console.error(erroEmpresas);
        mensagem.textContent = "Não foi possível carregar os estabelecimentos.";
        totalEmpresas.textContent = "";
        return;
    }

    const { data: listaServicos, error: erroServicos } = await supabaseClient
        .from("servicos")
        .select("id, estabelecimento_id, nome, descricao, duracao_minutos, preco, ativo")
        .eq("ativo", true)
        .order("nome");

    if (erroServicos) {
        console.error(erroServicos);
        mensagem.textContent = "Não foi possível carregar os serviços.";
        totalEmpresas.textContent = "";
        return;
    }

    estabelecimentos = empresas || [];
    servicos = listaServicos || [];

    carregarCategorias();
    renderizarEmpresas();
}

function carregarCategorias() {
    const categorias = [
        ...new Set(
            estabelecimentos
                .map(empresa => empresa.categoria?.trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    filtroCategoria.replaceChildren();

    const opcaoTodas = document.createElement("option");
    opcaoTodas.value = "";
    opcaoTodas.textContent = "Todas as categorias";
    filtroCategoria.appendChild(opcaoTodas);

    categorias.forEach(categoria => {
        const opcao = document.createElement("option");
        opcao.value = categoria;
        opcao.textContent = categoria;
        filtroCategoria.appendChild(opcao);
    });
}

function renderizarEmpresas() {
    const termo = buscaEmpresa.value.trim().toLocaleLowerCase("pt-BR");
    const categoriaSelecionada = filtroCategoria.value;

    const resultados = estabelecimentos.filter(empresa => {
        const nome = (empresa.nome || "").toLocaleLowerCase("pt-BR");
        const categoria = (empresa.categoria || "").toLocaleLowerCase("pt-BR");

        const correspondeNomeOuCategoria =
            nome.includes(termo) || categoria.includes(termo);

        const correspondeFiltro =
            !categoriaSelecionada || empresa.categoria === categoriaSelecionada;

        return correspondeNomeOuCategoria && correspondeFiltro;
    });

    listaEmpresas.replaceChildren();
    totalEmpresas.textContent =
        `${resultados.length} ${resultados.length === 1 ? "estabelecimento" : "estabelecimentos"}`;

    if (resultados.length === 0) {
        mensagem.textContent =
            "Nenhum estabelecimento encontrado. Tente outro nome ou categoria.";
        return;
    }

    mensagem.textContent = "";

    resultados.forEach(empresa => {
        const servicosEmpresa = servicos.filter(
            servico => servico.estabelecimento_id === empresa.id
        );

        const card = document.createElement("article");
        card.className = "empresa-card";

        const icone = document.createElement("div");
        icone.className = "empresa-icone";
        icone.textContent = "▦";
        icone.setAttribute("aria-hidden", "true");

        const nome = document.createElement("h3");
        nome.textContent = empresa.nome || "Estabelecimento";

        const categoria = document.createElement("p");
        categoria.className = "empresa-categoria";
        categoria.textContent = empresa.categoria || "Outros";

        const listaNomesServicos = document.createElement("p");
        listaNomesServicos.className = "empresa-servicos";

        if (servicosEmpresa.length > 0) {
            const nomes = servicosEmpresa
                .slice(0, 3)
                .map(servico => servico.nome);

            listaNomesServicos.textContent =
                nomes.join(" · ") +
                (servicosEmpresa.length > 3 ? " · e outros serviços" : "");
        } else {
            listaNomesServicos.textContent = "Consulte os serviços disponíveis.";
        }

        const botao = document.createElement("a");
        botao.className = "botao-servicos";
        botao.textContent = "Ver serviços →";
        botao.href = `agendar.html?estabelecimento=${encodeURIComponent(empresa.id)}`;
        botao.setAttribute(
            "aria-label",
            `Ver serviços de ${empresa.nome || "estabelecimento"}`
        );

        card.append(icone, nome, categoria, listaNomesServicos, botao);
        listaEmpresas.appendChild(card);
    });
}

buscaEmpresa.addEventListener("input", renderizarEmpresas);
filtroCategoria.addEventListener("change", renderizarEmpresas);

carregarEmpresas();
