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
  const CRM_URL = 'https://steadystate-production.up.railway.app';

  const form = document.getElementById('lead-form');
  const success = document.getElementById('form-success');
  if (!form || !success) return;

  // Map door range labels to a representative integer for the CRM
  const DOOR_MAP = { '1-20': 10, '21-50': 35, '51-100': 75, '101-200': 150, '200+': 200 };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting\u2026';

    // Collect basic fields
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Collect multi-value fields
    const issues = Array.from(form.querySelectorAll('input[name="issues"]:checked')).map(c => c.value);
    const propertyTypes = Array.from(document.querySelectorAll('.funnel-pill.active')).map(p => p.dataset.value);

    // Build a notes string from the enriched form fields
    const notesParts = [];
    if (issues.length)        notesParts.push('Service issues: ' + issues.join(', '));
    if (propertyTypes.length) notesParts.push('Property types: ' + propertyTypes.join(', '));

    const doorCount = DOOR_MAP[data.doors] || null;
    // Estimate MRR at ~$7/door/month, stored in cents
    const estimatedValue = doorCount ? doorCount * 7 * 100 : null;

    const payload = {
      company:        data.first_name + ' ' + data.last_name,
      contactName:    data.first_name + ' ' + data.last_name,
      contactEmail:   data.email   || null,
      contactPhone:   data.phone   || null,
      doorCount,
      region:         data.city_state  || null,
      pmSoftware:     data.software    || null,
      source:         'Website',
      stage:          'lead',
      priority:       'medium',
      notes:          notesParts.join(' | ') || null,
      tags:           propertyTypes.join(',') || null,
      estimatedValue,
    };

    try {
      const resp = await fetch(CRM_URL + '/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Server error ' + resp.status);
      }

      // Show success state
      form.style.display = 'none';
      success.classList.add('visible');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error('Form submission failed:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      // Show inline error message
      let errEl = form.querySelector('.form-error');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.className = 'form-error';
        errEl.style.cssText = 'color:#ef4444;font-size:0.875rem;margin-top:0.75rem;text-align:center;';
        form.querySelector('.form-submit-row').insertAdjacentElement('afterend', errEl);
      }
      errEl.textContent = 'Something went wrong — please try again or email us directly.';
    }
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
