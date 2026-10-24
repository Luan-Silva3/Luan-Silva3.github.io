
const campoServico = document.querySelector('#servico');
const campoData = document.querySelector('#dataAgendamento');
const campoHorario = document.querySelector('#horario');
const mensagem = document.querySelector('#mensagem');


let estabelecimentoId = null;

// Impede escolher uma data passada.
const hoje = new Date();
const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, '0');
const dia = String(hoje.getDate()).padStart(2, '0');

campoData.min = `${ano}-${mes}-${dia}`;

async function carregarServicos() {
    // Lê o ID da empresa selecionada na página de busca.
    const parametros = new URLSearchParams(window.location.search);
    estabelecimentoId = parametros.get('estabelecimento');

    if (!estabelecimentoId) {
        mensagem.textContent =
            'Nenhum estabelecimento foi selecionado. Volte à busca e escolha uma empresa.';

        campoServico.disabled = true;
        document.querySelector('#btnBuscarHorarios').disabled = true;
        document.querySelector('#agendarForm button[type="submit"]').disabled = true;
        return;
    }

    // Confirma que o estabelecimento existe.
    const { data: estabelecimento, error: erroEstabelecimento } =
        await supabaseClient
            .from('estabelecimentos')
            .select('id, nome')
            .eq('id', estabelecimentoId)
            .maybeSingle();

    if (erroEstabelecimento || !estabelecimento) {
        console.error('Erro ao buscar estabelecimento:', erroEstabelecimento);

        mensagem.textContent =
            'Não foi possível encontrar essa empresa. Volte à busca e tente novamente.';

        campoServico.disabled = true;
        document.querySelector('#btnBuscarHorarios').disabled = true;
        document.querySelector('#agendarForm button[type="submit"]').disabled = true;
        return;
    }

    // Busca somente os serviços ativos dessa empresa.
    const { data: servicos, error: erroServicos } = await supabaseClient
        .from('servicos')
        .select('id, nome, preco, duracao_minutos')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .order('nome');

    if (erroServicos) {
        console.error('Erro ao carregar serviços:', erroServicos);

        mensagem.textContent =
            'Não foi possível carregar os serviços dessa empresa.';
        return;
    }

    campoServico.replaceChildren();

    const opcaoInicial = document.createElement('option');
    opcaoInicial.value = '';
    opcaoInicial.textContent = 'Selecione um serviço';
    campoServico.appendChild(opcaoInicial);

    servicos.forEach(function (servico) {
        const opcao = document.createElement('option');

        opcao.value = servico.id;
        opcao.textContent =
            `${servico.nome} — R$ ${Number(servico.preco)
                .toFixed(2).replace('.', ',')} — ${servico.duracao_minutos} min`;

        campoServico.appendChild(opcao);
    });

    if (servicos.length === 0) {
        mensagem.textContent =
            'Esta empresa ainda não possui serviços ativos.';
    } else {
        mensagem.textContent = '';
    }
}


document.querySelector('#btnBuscarHorarios').addEventListener('click', async function () {
    const servicoId = campoServico.value;
    const dataEscolhida = campoData.value;

    if (!estabelecimentoId || !servicoId || !dataEscolhida) {
        mensagem.textContent = 'Selecione um serviço e uma data.';
        return;
    }

    campoHorario.disabled = true;
    campoHorario.replaceChildren();

    const carregando = document.createElement('option');
    carregando.textContent = 'Buscando horários...';
    campoHorario.appendChild(carregando);

    const { data, error } = await supabaseClient.rpc(
        'horarios_disponiveis',
        {
            p_estabelecimento_id: estabelecimentoId,
            p_servico_id: servicoId,
            p_data: dataEscolhida
        }
    );

    campoHorario.replaceChildren();

    if (error) {
        console.error('Erro ao buscar horários:', error.message);
        mensagem.textContent =
            'Não foi possível consultar os horários. Confira se você está autenticado.';
        campoHorario.disabled = true;
        return;
    }

    const opcaoInicial = document.createElement('option');
    opcaoInicial.value = '';
    opcaoInicial.textContent = 'Selecione um horário';
    campoHorario.appendChild(opcaoInicial);

    data.forEach(function (horario) {
        const inicio = new Date(horario.inicio);

        const opcao = document.createElement('option');
        opcao.value = horario.inicio;
        opcao.textContent = inicio.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });

        campoHorario.appendChild(opcao);
    });

    campoHorario.disabled = data.length === 0;

    mensagem.textContent = data.length > 0
        ? `${data.length} horário(s) disponível(is).`
        : 'Não há horários disponíveis nessa data.';
});

document.querySelector('#agendarForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const servicoId = campoServico.value;
    const nome = document.querySelector('#nomeCliente').value.trim();
    const telefone = document.querySelector('#telefoneCliente').value.trim();
    const inicio = campoHorario.value;

    if (!estabelecimentoId || !servicoId || !nome || !telefone || !inicio) {
        mensagem.textContent =
            'Preencha todos os campos e selecione um horário.';
        return;
    }

    const botaoEnviar = this.querySelector('button[type="submit"]');
    botaoEnviar.disabled = true;
    mensagem.textContent = 'Enviando solicitação...';

    try {
        const { data, error } = await supabaseClient.rpc(
            'criar_agendamento',
            {
                p_estabelecimento_id: estabelecimentoId,
                p_servico_id: servicoId,
                p_cliente_nome: nome,
                p_cliente_telefone: telefone,
                p_inicio: inicio
            }
        );

       if (error) {
    console.error('Erro completo ao criar agendamento:', error);

    mensagem.textContent = error.message;

    return;
}

        mensagem.textContent =
            'Agendamento solicitado! Aguarde a confirmação do estabelecimento.';

        this.reset();
        campoHorario.replaceChildren();

        const opcaoInicial = document.createElement('option');
        opcaoInicial.value = '';
        opcaoInicial.textContent = 'Selecione uma data e busque os horários';
        campoHorario.appendChild(opcaoInicial);
        campoHorario.disabled = true;

    } finally {
        botaoEnviar.disabled = false;
    }
});

carregarServicos();
