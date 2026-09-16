const { createClient } = window.supabase;
const client = createClient(
  window.MANTIQUEIRA_CONFIG.SUPABASE_URL,
  window.MANTIQUEIRA_CONFIG.SUPABASE_PUBLISHABLE_KEY
);

let drinks = [];
const $ = (s) => document.querySelector(s);
const list = $('#list');
const modal = $('#modal');
const form = $('#form');

const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
}[c]));

function toast(text) {
  const box = $('#toast');
  box.textContent = text;
  box.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => box.classList.remove('show'), 2400);
}

function showError(error) {
  console.error(error);
  toast(error?.message || 'Ocorreu um erro.');
}

async function requireSession() {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    window.location.href = 'login.html';
    return null;
  }
  const email = data.session.user.email || 'Administrador';
  $('#userEmail').textContent = email;
  return data.session;
}

async function loadDrinks() {
  const { data, error } = await client
    .from('drinks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showError(error);
    return;
  }

  drinks = data || [];
  render();
}

function render() {
  const q = $('#search').value.toLowerCase().trim();
  const filter = $('#filter').value;

  const rows = drinks.filter(d => {
    const text = `${d.name || ''} ${d.category || ''} ${d.description || ''}`.toLowerCase();
    const matchesSearch = text.includes(q);
    const matchesFilter = filter === 'all' ||
      (filter === 'yes' && d.available) ||
      (filter === 'no' && !d.available);
    return matchesSearch && matchesFilter;
  });

  $('#total').textContent = drinks.length;
  $('#available').textContent = drinks.filter(d => d.available).length;
  $('#unavailable').textContent = drinks.filter(d => !d.available).length;

  list.innerHTML = rows.map(d => `
    <div class="row">
      <div class="info">
        ${d.image_url ? `<img class="thumb" src="${esc(d.image_url)}" onerror="this.style.display='none'">` : '<div class="thumb"></div>'}
        <div class="name">
          <b>${esc(d.name)}</b>
          <small>${esc(d.ingredients || 'Sem ingredientes')}</small>
        </div>
      </div>
      <div class="cat">${esc(d.category)}</div>
      <div class="status ${d.available ? 'yes' : 'no'}">${d.available ? 'Disponível' : 'Indisponível'}</div>
      <div class="actions">
        <button class="edit" data-edit="${esc(d.id)}">Editar</button>
        <button class="delete" data-del="${esc(d.id)}">Excluir</button>
      </div>
    </div>
  `).join('');

  $('#empty').hidden = rows.length > 0;
}

function openModal(drink = null) {
  modal.classList.add('open');
  $('#modalTitle').textContent = drink ? 'Editar drink' : 'Novo drink';
  $('#id').value = drink?.id || '';
  $('#name').value = drink?.name || '';
  $('#category').value = drink?.category || '';
  $('#description').value = drink?.description || '';
  $('#ingredients').value = drink?.ingredients || '';
  $('#price').value = drink?.price ?? '';
  $('#imageFile').value = '';
  $('#imageFile').dataset.currentUrl = drink?.image_url || '';
  $('#imageFile').dataset.currentPath = drink?.image_path || '';
  $('#isAvailable').checked = drink ? drink.available : true;
  preview();
}

function closeModal() {
  modal.classList.remove('open');
  form.reset();
  $('#id').value = '';
  $('#isAvailable').checked = true;
  $('#preview').hidden = true;
  $('#uploadStatus').textContent = '';
  $('#imageFile').dataset.currentUrl = '';
  $('#imageFile').dataset.currentPath = '';
}

function previewSelectedImage() {
  const file = $('#imageFile').files[0];
  const currentUrl = $('#imageFile').dataset.currentUrl || '';
  $('#uploadStatus').textContent = '';

  if (!file) {
    $('#preview').hidden = !currentUrl;
    if (currentUrl) $('#previewImg').src = currentUrl;
    return;
  }

  if (!file.type.startsWith('image/')) {
    $('#imageFile').value = '';
    toast('Selecione uma imagem válida.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    $('#imageFile').value = '';
    toast('A imagem deve ter no máximo 5 MB.');
    return;
  }

  $('#preview').hidden = false;
  $('#previewImg').src = URL.createObjectURL(file);
  $('#uploadStatus').textContent = file.name;
}

async function uploadDrinkImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `drinks/${crypto.randomUUID()}.${ext || 'jpg'}`;

  const { error } = await client.storage
    .from('drink-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data } = client.storage.from('drink-images').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

async function removeDrinkImage(path) {
  if (!path) return;
  const { error } = await client.storage.from('drink-images').remove([path]);
  if (error) console.warn('Não foi possível remover a imagem antiga:', error);
}

$('#new').onclick = () => openModal();
$('#emptyNew').onclick = () => openModal();
$('#search').oninput = render;
$('#filter').onchange = render;
$('#imageFile').onchange = previewSelectedImage;

$('#logout').onclick = async () => {
  await client.auth.signOut();
  window.location.href = 'login.html';
};

document.addEventListener('click', async (event) => {
  if (event.target.closest('[data-close]')) closeModal();

  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    const drink = drinks.find(d => d.id === editButton.dataset.edit);
    if (drink) openModal(drink);
  }

  const deleteButton = event.target.closest('[data-del]');
  if (deleteButton) {
    const drink = drinks.find(d => d.id === deleteButton.dataset.del);
    if (!drink || !confirm(`Excluir "${drink.name}"?`)) return;

    const { error } = await client.from('drinks').delete().eq('id', drink.id);
    if (error) {
      showError(error);
      return;
    }

    if (drink.image_path) await removeDrinkImage(drink.image_path);

    drinks = drinks.filter(d => d.id !== drink.id);
    render();
    toast('Drink excluído.');
  }
});

form.onsubmit = async (event) => {
  event.preventDefault();

  const id = $('#id').value;
  const payload = {
    name: $('#name').value.trim(),
    category: $('#category').value,
    description: $('#description').value.trim(),
    ingredients: $('#ingredients').value.trim(),
    price: $('#price').value.trim() ? Number($('#price').value.replace(',', '.')) : null,
    image_url: $('#imageFile').dataset.currentUrl || null,
    image_path: $('#imageFile').dataset.currentPath || null,
    available: $('#isAvailable').checked
  };

  if (!payload.name || !payload.category) {
    toast('Preencha nome e categoria.');
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Salvando...';

  let error;
  let newImagePath = null;
  const oldImagePath = $('#imageFile').dataset.currentPath || null;

  try {
    const file = $('#imageFile').files[0];
    if (file) {
      const uploaded = await uploadDrinkImage(file);
      payload.image_url = uploaded.url;
      payload.image_path = uploaded.path;
      newImagePath = uploaded.path;
    }
  } catch (uploadError) {
    button.disabled = false;
    button.textContent = 'Salvar drink';
    showError(uploadError);
    return;
  }

  if (id) {
    ({ error } = await client.from('drinks').update(payload).eq('id', id));
  } else {
    ({ error } = await client.from('drinks').insert(payload));
  }

  button.disabled = false;
  button.textContent = 'Salvar drink';

  if (error) {
    if (newImagePath) await removeDrinkImage(newImagePath);
    showError(error);
    return;
  }

  if (id && newImagePath && oldImagePath && oldImagePath !== newImagePath) {
    await removeDrinkImage(oldImagePath);
  }

  closeModal();
  await loadDrinks();
  toast(id ? 'Drink atualizado.' : 'Drink cadastrado.');
};

document.onkeydown = event => {
  if (event.key === 'Escape') closeModal();
};

const menu = $('#menu');
menu.onclick = () => document.querySelector('.sidebar').classList.toggle('open');

(async function init() {
  const session = await requireSession();
  if (session) await loadDrinks();
})();
