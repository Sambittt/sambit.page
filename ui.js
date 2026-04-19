(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealTargets = Array.from(document.querySelectorAll('.hero, .card, .list-item'));
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if (revealTargets.length && !reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  if (reducedMotion) return;

  const interactiveCards = Array.from(document.querySelectorAll('.card, .hero'));

  interactiveCards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nx = x / rect.width;
      const ny = y / rect.height;
      const tiltX = (0.5 - ny) * 5;
      const tiltY = (nx - 0.5) * 7;

      card.style.setProperty('--mx', `${(nx * 100).toFixed(2)}%`);
      card.style.setProperty('--my', `${(ny * 100).toFixed(2)}%`);
      card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });
})();
