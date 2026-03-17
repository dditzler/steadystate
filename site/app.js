// ===========================
// SteadyState — App Logic
// ===========================

// --- Dark Mode Toggle ---
(function(){
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  
  function updateIcon() {
    if (!t) return;
    t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode');
    t.innerHTML = d === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  updateIcon();
  
  if (t) {
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      updateIcon();
    });
  }
})();

// --- Scroll Reveal ---
(function(){
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });
  
  revealEls.forEach(el => observer.observe(el));
})();

// --- Funnel Pills (toggle) ---
(function(){
  const container = document.getElementById('property-types');
  if (!container) return;
  
  container.addEventListener('click', (e) => {
    const pill = e.target.closest('.funnel-pill');
    if (!pill) return;
    pill.classList.toggle('active');
  });
})();

// --- Form Handling ---
(function(){
  const form = document.getElementById('lead-form');
  const success = document.getElementById('form-success');
  if (!form || !success) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Collect checkboxes
    data.issues = Array.from(form.querySelectorAll('input[name="issues"]:checked')).map(c => c.value);
    
    // Collect funnel pills
    data.property_types = Array.from(document.querySelectorAll('.funnel-pill.active')).map(p => p.dataset.value);
    
    // Log it (in production, POST to API)
    console.log('Lead form submitted:', data);
    
    // Show success
    form.style.display = 'none';
    success.classList.add('visible');
    
    // Scroll to success
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
