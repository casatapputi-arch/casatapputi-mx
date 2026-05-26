function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// Endpoint de Formspree de Casa Tapputi — reemplazar TU_FORM_ID por el id real.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/TU_FORM_ID';

function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('.form-submit');
  const original = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;
  fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  })
  .then(r => {
    if (r.ok) {
      const ok = form.parentElement.querySelector('.form-success');
      if (ok) ok.style.display = 'block';
      form.style.display = 'none';
    } else {
      btn.textContent = original;
      btn.disabled = false;
      alert('Error al enviar. Intenta de nuevo o llámanos al (52) 1 56-1611-8734.');
    }
  })
  .catch(() => {
    btn.textContent = original;
    btn.disabled = false;
    alert('Error de conexión. Intenta de nuevo o llámanos al (52) 1 56-1611-8734.');
  });
}
