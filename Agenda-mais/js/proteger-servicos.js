
async function protegerServicos() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = 'login.html';
        return;
    }
}

protegerServicos();
