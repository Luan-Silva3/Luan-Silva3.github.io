
async function protegerAgendamentos() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = 'login.html';
        return;
    }
}

protegerAgendamentos();
