const SUPABASE_URL = 'https://hlslprojwejvmanzumrk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ArM4XQI0B-z76OuQoxzjfA_eH2Iu4Py';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let loginForm = document.querySelector('#loginForm');

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    let email = document.querySelector('#email').value;
    let password = document.querySelector('#senha').value;
    let mensagem= document.querySelector('#mensagem');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        mensagem.textContent = "Erro ao fazer o login"
        mensagem.style.color = 'red';
    } else {
        mensagem.textContent = 'login realizado com sucesso';
        mensagem.style.color = 'green';
        window.location.href = 'dashboard.html';
    }
});