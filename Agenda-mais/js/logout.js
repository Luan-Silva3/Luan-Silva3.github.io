
const btnSair = document.querySelector('#btnSair');

btnSair.addEventListener('click', async function () {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error('Erro ao sair:', error.message);
        alert('Não foi possível sair da conta.');
        return;
    }

    window.location.href = 'login.html';
});
