document.addEventListener('DOMContentLoaded', () => {

  gsap.registerPlugin(ScrollTrigger);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     HERO INTRO (runs immediately on load)
  ========================================================= */
  // Set initial hidden state first so the timeline below animates from it
  gsap.set('.hero__eyebrow, .hero__sub, .hero__actions, .hero__readout', { opacity: 0, y: 20 });

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTl
    .to('.hero__eyebrow', { opacity: 1, y: 0, duration: .7 }, 0.1)
    .from('.hero__title .line', {
      yPercent: 120,
      opacity: 0,
      duration: .9,
      stagger: 0.09
    }, 0.25)
    .to('.hero__sub', { opacity: 1, y: 0, duration: .8 }, 0.7)
    .to('.hero__actions', { opacity: 1, y: 0, duration: .8 }, 0.85)
    .to('.hero__readout', { opacity: 1, y: 0, duration: .8, onComplete: runCounters }, 1.0);

  /* =========================================================
     GENERIC SCROLL REVEALS
  ========================================================= */
  const revealTargets = gsap.utils.toArray('.reveal').filter(el => !el.closest('.hero'));

  revealTargets.forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  /* =========================================================
     FEATURE ROWS — alternating slide-in
  ========================================================= */
  gsap.utils.toArray('.feature').forEach((feature) => {
    const isReverse = feature.classList.contains('feature--reverse');
    const copy = feature.querySelector('.feature__copy');
    const visual = feature.querySelector('.feature__visual');

    gsap.fromTo(copy,
      { x: isReverse ? 60 : -60, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: feature, start: 'top 75%', toggleActions: 'play none none reverse' }
      }
    );
    gsap.fromTo(visual,
      { x: isReverse ? -60 : 60, opacity: 0, scale: 0.94 },
      {
        x: 0, opacity: 1, scale: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: feature, start: 'top 75%', toggleActions: 'play none none reverse' }
      }
    );
  });

  /* =========================================================
     PROBLEM CARDS — staggered grid reveal
  ========================================================= */
  gsap.fromTo('.problem__card',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: .7, stagger: 0.12, ease: 'power2.out',
      scrollTrigger: { trigger: '.problem__grid', start: 'top 82%' }
    }
  );

  /* =========================================================
     PRICING CARDS
  ========================================================= */
  gsap.fromTo('.price-card',
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0, duration: .8, stagger: 0.15, ease: 'power2.out',
      scrollTrigger: { trigger: '.pricing__grid', start: 'top 82%' }
    }
  );

  /* =========================================================
     WAVEFORM DRAW-IN (feature 02)
  ========================================================= */
  const waveformPath = document.querySelector('.waveform polyline');
  if (waveformPath) {
    const len = waveformPath.getTotalLength ? waveformPath.getTotalLength() : 1200;
    gsap.set(waveformPath, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(waveformPath, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: '.wave-card', start: 'top 80%' }
    });
  }

  /* =========================================================
     COUNTERS (hero readout)
  ========================================================= */
  function runCounters() {
    document.querySelectorAll('.readout__value').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.4,
        ease: 'power1.out',
        onUpdate: () => {
          el.textContent = target % 1 === 0 ? Math.round(obj.val) : obj.val.toFixed(1);
        }
      });
    });
  }
  if (reduceMotion) {
    // just set final values, skip animated intro entirely
    gsap.set('.hero__eyebrow, .hero__sub, .hero__actions, .hero__readout, .hero__title .line', { opacity: 1, y: 0, yPercent: 0 });
    document.querySelectorAll('.readout__value').forEach(el => {
      el.textContent = el.dataset.count;
    });
  }

  /* =========================================================
     FAQ ACCORDION
  ========================================================= */
  document.querySelectorAll('.faq__item').forEach(item => {
    const q = item.querySelector('.faq__q');
    const a = item.querySelector('.faq__a');

    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // close any other open item
      document.querySelectorAll('.faq__item.is-open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          gsap.to(openItem.querySelector('.faq__a'), { height: 0, duration: .4, ease: 'power2.inOut' });
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        gsap.to(a, { height: 0, duration: .4, ease: 'power2.inOut' });
      } else {
        item.classList.add('is-open');
        gsap.set(a, { height: 'auto' });
        gsap.from(a, { height: 0, duration: .45, ease: 'power2.inOut' });
      }
    });
  });

  /* =========================================================
     MOBILE MENU
  ========================================================= */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      mobileMenu.classList.toggle('is-open');
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('is-open'));
    });
  }

  /* =========================================================
     NAV BACKGROUND ON SCROLL (subtle)
  ========================================================= */
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: (self) => {
      const nav = document.querySelector('.nav');
      if (self.scroll() > 80) nav.style.borderBottomColor = 'rgba(111,235,170,.25)';
      else nav.style.borderBottomColor = '';
    }
  });

});
