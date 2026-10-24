

const listaAgendamentos = document.querySelector('#listaAgendamentos');
const mensagemAgendamentos = document.querySelector('#mensagem');
const filtroData = document.querySelector('#filtroData');
const filtroStatus = document.querySelector('#filtroStatus');
const totalPendentes = document.querySelector('#totalPendentes');
const totalConfirmados = document.querySelector('#totalConfirmados');
const totalConcluidos = document.querySelector('#totalConcluidos');
const totalCancelados = document.querySelector('#totalCancelados');

let estabelecimentoId = null;

async function buscarEstabelecimento() {
    const { data: usuarioData, error: erroUsuario } =
        await supabaseClient.auth.getUser();

    if (erroUsuario || !usuarioData.user) {
        window.location.href = 'login.html';
        return;
    }

    const { data, error } = await supabaseClient
        .from('estabelecimentos')
        .select('id')
        .eq('usuario_id', usuarioData.user.id)
        .single();

    if (error) {
        console.error(error.message);
        mensagemAgendamentos.textContent =
            'Não foi possível carregar o estabelecimento.';
        return;
    }

    estabelecimentoId = data.id;
    await carregarAgendamentos();
}

async function carregarAgendamentos() {
    if (!estabelecimentoId) return;

    mensagemAgendamentos.textContent = 'Carregando agendamentos...';
    listaAgendamentos.replaceChildren();

    let consulta = supabaseClient
        .from('agendamentos')
        .select(`
            id,
            cliente_nome,
            cliente_telefone,
            inicio,
            fim,
            status,
            servicos ( nome )
        `)
        .eq('estabelecimento_id', estabelecimentoId);


    if (filtroData.value) {
        const inicioDia = new Date(`${filtroData.value}T00:00:00-03:00`);
        const fimDia = new Date(`${filtroData.value}T00:00:00-03:00`);

        fimDia.setDate(fimDia.getDate() + 1);

        consulta = consulta
            .gte('inicio', inicioDia.toISOString())
            .lt('inicio', fimDia.toISOString());
    }

    // O filtro de status fica fora do filtro de data
    if (filtroStatus.value !== 'todos') {
        consulta = consulta.eq('status', filtroStatus.value);
    }

    // A ordenação também fica fora dos filtros
    consulta = consulta.order('inicio');


    const { data, error } = await consulta;

    if (error) {
        console.error('Erro ao carregar agendamentos:', error.message);
        mensagemAgendamentos.textContent =
            'Erro ao carregar agendamentos.';
        return;
    }

    mensagemAgendamentos.textContent = '';

    await carregarResumo();
    if (data.length === 0) {
        mensagemAgendamentos.textContent =
            'Nenhum agendamento encontrado para essa data.';
        return;
    }

    data.forEach(function (agendamento) {
        const item = document.createElement('li');
        const inicio = new Date(agendamento.inicio);
        const fim = new Date(agendamento.fim);

        const titulo = document.createElement('h3');
        titulo.textContent =
            `${agendamento.cliente_nome} — ${agendamento.servicos?.nome ?? 'Serviço'}`;

        const telefone = document.createElement('p');
        telefone.textContent =
            `Telefone: ${agendamento.cliente_telefone}`;

        const horario = document.createElement('p');
        horario.textContent =
            `Das ${inicio.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            })} às ${fim.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            })}`;

        const status = document.createElement('p');
        status.textContent = `Status: ${agendamento.status}`;


        item.append(titulo, telefone, horario, status);


        if (agendamento.status === 'pendente') {
            const botaoConfirmar = document.createElement('button');

            botaoConfirmar.textContent = 'Confirmar';

            botaoConfirmar.addEventListener('click', function () {
                atualizarStatus(agendamento.id, 'confirmado');
            });

            item.appendChild(botaoConfirmar);
        }

        if (
            agendamento.status === 'pendente' ||
            agendamento.status === 'confirmado'
        ) {
            const botaoCancelar = document.createElement('button');

            botaoCancelar.textContent = 'Cancelar';

            botaoCancelar.addEventListener('click', function () {
                atualizarStatus(agendamento.id, 'cancelado');
            });

            item.appendChild(botaoCancelar);
        }

       
if (agendamento.status === 'confirmado') {
    const botaoConcluir = document.createElement('button');

    botaoConcluir.textContent = 'Concluir';

    botaoConcluir.addEventListener('click', function () {
        atualizarStatus(agendamento.id, 'concluido');
    });

    item.appendChild(botaoConcluir);
}

if (
    agendamento.status === 'concluido' ||
    agendamento.status === 'cancelado'
) {
    const botaoExcluir = document.createElement('button');

    botaoExcluir.textContent = 'Excluir';

    botaoExcluir.addEventListener('click', function () {
        excluirAgendamento(agendamento.id);
    });

    item.appendChild(botaoExcluir);
}

listaAgendamentos.appendChild(item);


    });
}

function atualizarResumo(agendamentos) {
    totalPendentes.textContent =
        agendamentos.filter(a => a.status === 'pendente').length;

    totalConfirmados.textContent =
        agendamentos.filter(a => a.status === 'confirmado').length;

    totalConcluidos.textContent =
        agendamentos.filter(a => a.status === 'concluido').length;

    totalCancelados.textContent =
        agendamentos.filter(a => a.status === 'cancelado').length;
}


async function carregarResumo() {
    if (!estabelecimentoId) return;

    let consultaResumo = supabaseClient
        .from('agendamentos')
        .select('status')
        .eq('estabelecimento_id', estabelecimentoId);

    if (filtroData.value) {
        const inicioDia = new Date(
            `${filtroData.value}T00:00:00-03:00`
        );

        const fimDia = new Date(
            `${filtroData.value}T00:00:00-03:00`
        );

        fimDia.setDate(fimDia.getDate() + 1);

        consultaResumo = consultaResumo
            .gte('inicio', inicioDia.toISOString())
            .lt('inicio', fimDia.toISOString());
    }

    const { data, error } = await consultaResumo;

    if (error) {
        console.error('Erro ao carregar resumo:', error.message);
        return;
    }

    atualizarResumo(data ?? []);
}


document.querySelector('#btnFiltrar').addEventListener('click', function () {
    carregarAgendamentos();
});
filtroStatus.addEventListener('change', function () {
    carregarAgendamentos();
});

async function atualizarStatus(agendamentoId, novoStatus) {
    const { error } = await supabaseClient
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', agendamentoId)
        .eq('estabelecimento_id', estabelecimentoId);

    if (error) {
        console.error('Erro ao atualizar status:', error);
        mensagemAgendamentos.textContent =
            'Não foi possível atualizar o agendamento.';
        return;
    }

    mensagemAgendamentos.textContent =
        'Status do agendamento atualizado!';

    await carregarAgendamentos();
}

async function excluirAgendamento(agendamentoId) {
    const confirmar = window.confirm(
        'Tem certeza que deseja excluir este agendamento permanentemente? Essa ação não pode ser desfeita.'
    );

    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoId)
        .eq('estabelecimento_id', estabelecimentoId)
        .in('status', ['concluido', 'cancelado']);

    if (error) {
        console.error('Erro ao excluir agendamento:', error);
        mensagemAgendamentos.textContent =
            'Não foi possível excluir o agendamento.';
        return;
    }

    mensagemAgendamentos.textContent =
        'Agendamento excluído com sucesso!';

    await carregarAgendamentos();
}

buscarEstabelecimento();
