const SUPABASE_URL = 'https://hlslprojwejvmanzumrk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ArM4XQI0B-z76OuQoxzjfA_eH2Iu4Py';

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let cadastrar = document.querySelector('#cadastroForm');

cadastrar.addEventListener("submit", async function (event) {
     event.preventDefault();

    let campoNome = document.querySelector('#nomeCliente');

    let nomeCliente = campoNome.value.trim();

    if (nomeCliente === "") {
        console.log("Digite seu nome");
        return;
    }

    let campoNomeEstabelecimento = document.querySelector('#nomeEstabelecimento');
    let nomeEstabelecimento = campoNomeEstabelecimento.value.trim();

    if (nomeEstabelecimento === "") {
        console.log("Digite o nome do estabelecimento");
        return;
    }

    let campoEmail = document.querySelector('#email');

    let email = campoEmail.value.trim();

    if (email === "") {
        console.log("Digite seu email");
        return;
    }
    if (!email.includes("@") || !email.includes(".")) {
        console.log("Digite um email valido");
        return;
    }

    let campoSenha = document.querySelector('#senha');
    let senha = campoSenha.value;

    if (senha === "") {
        console.log("Digite sua senha");
        return;
    }

    if (senha.length < 6) {
        console.log("A senha deve ter pelo menos 6 caracteres");
        return;
    }

    let campoConfirmarSenha = document.querySelector('#confirmarSenha')
    let confirmarSenha = campoConfirmarSenha.value;

    if (confirmarSenha !== senha) {
        console.log("As senhas não coincidem");
        return;
    }

    
const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: senha,
    options: {
        data: {
            nome: nomeCliente,
            nome_estabelecimento: nomeEstabelecimento
        }
    }
});

if (error) {
    console.error("Erro ao cadastrar:", error.message);
    alert("Erro ao cadastrar: " + error.message);
    return;
}

console.log("Resposta do cadastro:", data);
alert("Solicitação de cadastro enviada! Verifique o resultado no Supabase.");

});

