// Theme toggle
(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('edlearn_theme');
  if(saved) root.setAttribute('data-theme', saved);
  themeToggle?.addEventListener('click', ()=>{
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', cur === 'dark' ? 'dark' : '');
    localStorage.setItem('edlearn_theme', cur==='dark'?'dark':'');
  });
})();

// Modal and auth logic
(function(){
  const loginBtn = document.getElementById('loginBtn');
  const signupCta = document.getElementById('signupCta');
  const modal = document.getElementById('authModal');
  const closeModal = document.getElementById('closeModal');
  const tabLogin = document.getElementById('tabLogin');
  const tabCreate = document.getElementById('tabCreate');
  const loginForm = document.getElementById('loginForm');
  const createForm = document.getElementById('createForm');
  const authMessage = document.getElementById('authMessage');

  const open = ()=>{ modal.setAttribute('aria-hidden','false'); }
  const close = ()=>{ modal.setAttribute('aria-hidden','true'); authMessage.textContent=''; }

  loginBtn?.addEventListener('click', open);
  signupCta?.addEventListener('click', ()=>{ open(); showCreate(); });
  closeModal?.addEventListener('click', close);

  tabLogin?.addEventListener('click', showLogin);
  tabCreate?.addEventListener('click', showCreate);

  function showLogin(){ tabLogin.classList.add('active'); tabCreate.classList.remove('active'); loginForm.classList.remove('hidden'); createForm.classList.add('hidden'); }
  function showCreate(){ tabCreate.classList.add('active'); tabLogin.classList.remove('active'); createForm.classList.remove('hidden'); loginForm.classList.add('hidden'); }

  // password hashing using Web Crypto
  async function hashPassword(password){
    const enc = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem('edlearn_users')||'[]'); }catch(e){return []}
  }
  function saveUsers(users){ localStorage.setItem('edlearn_users', JSON.stringify(users)); }

  createForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('createName').value.trim();
    const phone = document.getElementById('createPhone').value.trim();
    const address = document.getElementById('createAddress').value.trim();
    const email = document.getElementById('createEmail').value.trim().toLowerCase();
    const password = document.getElementById('createPassword').value;
    if(!email||!password||!name){ authMessage.textContent='Please fill required fields.'; return; }

    // Try backend first
    const backendUrl = 'http://localhost:3000';
    try{
      const resp = await fetch(backendUrl + '/api/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({name,phone,address,email,password})
      });
      if(resp.ok){
        const data = await resp.json();
        authMessage.textContent='Account created successfully. You can now login (server).';
        createForm.reset(); showLogin();
        return;
      } else {
        const err = await resp.json().catch(()=>({error:'unknown'}));
        if(err && err.error === 'email_exists'){ authMessage.textContent='An account with that email already exists.'; return; }
        // fallthrough to local fallback
      }
    }catch(err){ /* server unreachable -> fallback */ }

    // Fallback: localStorage-based demo
    const users = getUsers();
    if(users.find(u=>u.email===email)){ authMessage.textContent='An account with that email already exists.'; return; }
    const phash = await hashPassword(password);
    users.push({name,phone,address,email,passwordHash:phash,created:Date.now()});
    saveUsers(users);
    authMessage.textContent='Account created successfully (local demo). You can now login.';
    createForm.reset();
    showLogin();
  });

  loginForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    if(!email||!password){ authMessage.textContent='Please enter email and password.'; return; }

    const backendUrl = 'http://localhost:3000';
    try{
      const resp = await fetch(backendUrl + '/api/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({email,password})
      });
      if(resp.ok){
        const data = await resp.json();
        authMessage.textContent = `Welcome back, ${data.user.name}!`;
        sessionStorage.setItem('edlearn_current', JSON.stringify({email:data.user.email,name:data.user.name}));
        setTimeout(()=>{ close(); }, 800);
        return;
      }
      // else fall through to local fallback
    }catch(err){ /* server unreachable -> fallback */ }

    // Fallback: localStorage-based demo
    const users = getUsers();
    const user = users.find(u=>u.email===email);
    if(!user){ authMessage.textContent='No account found for that email.'; return; }
    const phash = await hashPassword(password);
    if(phash !== user.passwordHash){ authMessage.textContent='Incorrect password.'; return; }
    authMessage.textContent = `Welcome back, ${user.name}!`;
    sessionStorage.setItem('edlearn_current', JSON.stringify({email:user.email,name:user.name}));
    setTimeout(()=>{ close(); }, 800);
  });

  // Close modal on outside click
  modal?.addEventListener('click', (e)=>{ if(e.target===modal) close(); });
})();

// Simple slider
(function(){
  const slider = document.getElementById('courseSlider');
  if(!slider) return;
  const slidesWrap = slider.querySelector('.slides');
  const slides = slider.querySelectorAll('.slide');
  let idx = 0;
  const total = slides.length;
  const prev = slider.querySelector('.slider-btn.prev');
  const next = slider.querySelector('.slider-btn.next');

  function show(i){ idx = (i+total)%total; slidesWrap.style.transform = `translateX(${-idx*100}%)`; }
  prev?.addEventListener('click', ()=> show(idx-1));
  next?.addEventListener('click', ()=> show(idx+1));
  let auto = setInterval(()=> show(idx+1), 5000);
  slider.addEventListener('mouseenter', ()=> clearInterval(auto));
  slider.addEventListener('mouseleave', ()=> auto = setInterval(()=> show(idx+1), 5000));
  show(0);
})();
