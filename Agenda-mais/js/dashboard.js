
async function carregarEstabelecimento() {
    const { data: usuarioData, error: erroUsuario } =
        await supabaseClient.auth.getUser();

    if (erroUsuario || !usuarioData.user) {
        window.location.href = 'login.html';
        return;
    }

    const usuarioId = usuarioData.user.id;

    const { data, error } = await supabaseClient
        .from('estabelecimentos')
        .select('nome')
        .eq('usuario_id', usuarioId)
        .single();

    const campoNome = document.querySelector('#nomeEstabelecimento');

    if (error) {
        console.error('Erro ao carregar estabelecimento:', error.message);
        campoNome.textContent = 'Não foi possível carregar o estabelecimento.';
        return;
    }

    campoNome.textContent = data.nome;
}

carregarEstabelecimento();
