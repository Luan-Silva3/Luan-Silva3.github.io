
const listaDias = document.querySelector('#listaDias');

const diasSemana = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
];

diasSemana.forEach(function (dia, indice) {
    const bloco = document.createElement('div');

    const titulo = document.createElement('h3');
    titulo.textContent = dia;

    const labelAtivo = document.createElement('label');
    labelAtivo.textContent = 'Atende neste dia?';

    const ativo = document.createElement('input');
    ativo.type = 'checkbox';
    ativo.checked = indice >= 1 && indice <= 5;
    ativo.dataset.dia = indice;

    const labelAbertura = document.createElement('label');
    labelAbertura.textContent = 'Abertura';

    const abertura = document.createElement('input');
    abertura.type = 'time';
    abertura.value = '09:00';
    abertura.dataset.abertura = indice;

    const labelFechamento = document.createElement('label');
    labelFechamento.textContent = 'Fechamento';

    const fechamento = document.createElement('input');
    fechamento.type = 'time';
    fechamento.value = '18:00';
    fechamento.dataset.fechamento = indice;

    bloco.append(
        titulo,
        labelAtivo,
        ativo,
        labelAbertura,
        abertura,
        labelFechamento,
        fechamento
    );

    listaDias.appendChild(bloco);
});



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
        console.error('Erro ao buscar estabelecimento:', error.message);
        document.querySelector('#mensagem').textContent =
            'Não foi possível carregar o estabelecimento.';
        return;
    }

    estabelecimentoId = data.id;

    await carregarHorarios();
}

async function carregarHorarios() {
    const { data, error } = await supabaseClient
        .from('horarios_funcionamento')
        .select('dia_semana, hora_abertura, hora_fechamento, ativo')
        .eq('estabelecimento_id', estabelecimentoId);

    if (error) {
        console.error('Erro ao carregar horários:', error.message);
        document.querySelector('#mensagem').textContent =
            'Não foi possível carregar os horários.';
        return;
    }

    data.forEach(function (horario) {
        const dia = horario.dia_semana;

        const checkbox = document.querySelector(
            `input[data-dia="${dia}"]`
        );

        const abertura = document.querySelector(
            `input[data-abertura="${dia}"]`
        );

        const fechamento = document.querySelector(
            `input[data-fechamento="${dia}"]`
        );

        if (checkbox) checkbox.checked = horario.ativo;
        if (abertura) abertura.value = horario.hora_abertura.slice(0, 5);
        if (fechamento) fechamento.value = horario.hora_fechamento.slice(0, 5);
    });
}

const horariosForm = document.querySelector('#horariosForm');
const mensagemHorarios = document.querySelector('#mensagem');

horariosForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!estabelecimentoId) {
        mensagemHorarios.textContent = 'Estabelecimento não carregado.';
        return;
    }

    const horarios = [];

    for (let dia = 0; dia <= 6; dia++) {
        const checkbox = document.querySelector(
            `input[data-dia="${dia}"]`
        );

        const abertura = document.querySelector(
            `input[data-abertura="${dia}"]`
        );

        const fechamento = document.querySelector(
            `input[data-fechamento="${dia}"]`
        );

        if (checkbox.checked) {
            if (!abertura.value || !fechamento.value) {
                mensagemHorarios.textContent =
                    'Preencha a abertura e o fechamento dos dias ativos.';
                return;
            }

            if (fechamento.value <= abertura.value) {
                mensagemHorarios.textContent =
                    'O fechamento deve ser depois da abertura.';
                return;
            }
        }

        horarios.push({
            estabelecimento_id: estabelecimentoId,
            dia_semana: dia,
            hora_abertura: abertura.value || '09:00',
            hora_fechamento: fechamento.value || '18:00',
            ativo: checkbox.checked
        });
    }

    const { error } = await supabaseClient
        .from('horarios_funcionamento')
        .upsert(horarios, {
            onConflict: 'estabelecimento_id,dia_semana'
        });

    if (error) {
        console.error('Erro ao salvar horários:', error.message);
        mensagemHorarios.textContent = 'Erro ao salvar horários.';
        return;
    }

    mensagemHorarios.textContent = 'Horários salvos com sucesso!';
});

buscarEstabelecimento();
