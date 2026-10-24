
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
            'Não foi possível carregar seu estabelecimento.';
        return;
    }

    estabelecimentoId = data.id;
    await listarServicos();
    console.log('Estabelecimento carregado:', estabelecimentoId);
}

buscarEstabelecimento();


const servicoForm = document.querySelector('#servicoForm');
const mensagem = document.querySelector('#mensagem');

servicoForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!estabelecimentoId) {
        mensagem.textContent = 'Estabelecimento não carregado.';
        return;
    }

    const nome = document.querySelector('#nomeServico').value.trim();
    const descricao = document.querySelector('#descricaoServico').value.trim();
    const preco = Number(document.querySelector('#precoServico').value);
    const duracao = Number(document.querySelector('#duracaoServico').value);

    const { error } = await supabaseClient
        .from('servicos')
        .insert({
            estabelecimento_id: estabelecimentoId,
            nome: nome,
            descricao: descricao || null,
            preco: preco,
            duracao_minutos: duracao
        });

    if (error) {
        console.error('Erro ao cadastrar serviço:', error.message);
        mensagem.textContent = 'Erro ao cadastrar serviço.';
        return;
    }

    mensagem.textContent = 'Serviço cadastrado com sucesso!';
    servicoForm.reset();
    await listarServicos();
});


async function listarServicos() {
    const listaServicos = document.querySelector('#listaServicos');

    const { data, error } = await supabaseClient
        .from('servicos')
        .select('id, nome, descricao, preco, duracao_minutos')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
        .order('nome');

    if (error) {
        console.error('Erro ao listar serviços:', error.message);
        mensagem.textContent = 'Não foi possível carregar os serviços.';
        return;
    }

    listaServicos.innerHTML = '';

    data.forEach(function (servico) {
        const item = document.createElement('li');

        const nome = document.createElement('h3');
        nome.textContent = servico.nome;

        const descricao = document.createElement('p');
        descricao.textContent = servico.descricao || 'Sem descrição';

        const detalhes = document.createElement('p');
        detalhes.textContent =
            `R$ ${Number(servico.preco).toFixed(2).replace('.', ',')} • ${servico.duracao_minutos} minutos`;


        const botaoExcluir = document.createElement('button');

        botaoExcluir.type = 'button';
        botaoExcluir.textContent = 'Excluir serviço';

        botaoExcluir.addEventListener('click', function () {
            excluirServico(servico.id, servico.nome);
        });

        item.append(nome, descricao, detalhes, botaoExcluir);
        listaServicos.appendChild(item);

    });

    if (data.length === 0) {
        listaServicos.textContent = 'Nenhum serviço cadastrado ainda.';
    }
}

async function excluirServico(servicoId, nomeServico) {
    const confirmar = window.confirm(
        `Deseja excluir permanentemente o serviço "${nomeServico}"?`
    );

    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('servicos')
        .delete()
        .eq('id', servicoId)
        .eq('estabelecimento_id', estabelecimentoId);

    if (error) {
        console.error('Erro ao excluir serviço:', error);

        if (error.code === '23503') {
            mensagem.textContent =
                'Este serviço possui agendamentos vinculados e não pode ser excluído. Desative-o para não perder o histórico.';
        } else {
            mensagem.textContent =
                'Não foi possível excluir o serviço.';
        }

        return;
    }

    mensagem.textContent = 'Serviço excluído com sucesso!';

    await listarServicos();
}
