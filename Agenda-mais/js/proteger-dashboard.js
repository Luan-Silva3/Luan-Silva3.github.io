

async function protegerDashboard() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = 'login.html';
        return;
    }

    console.log('Usuário autenticado:', data.session.user.email);
}

protegerDashboard();
