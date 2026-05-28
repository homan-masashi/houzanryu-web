// ヘッダースクロール効果
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ハンバーガーメニュー
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

navToggle.addEventListener('click', () => {
  siteNav.classList.toggle('open');
  const spans = navToggle.querySelectorAll('span');
  if (siteNav.classList.contains('open')) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// ナビリンククリックでメニューを閉じる
document.querySelectorAll('.site-nav a').forEach(link => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    const spans = navToggle.querySelectorAll('span');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

// スクロールアニメーション
const fadeEls = document.querySelectorAll(
  '.section-header, .about-grid, .about-card, .history-list, ' +
  '.lesson-card, .dojo-info, .trial-box, .gallery-item, .event-item, .contact-form, .contact-info'
);

fadeEls.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => observer.observe(el));

// ギャラリー ライトボックス
const lightbox = document.getElementById('lightbox');
const lightboxVisual = lightbox.querySelector('.lightbox-visual');
const lightboxLabel = lightbox.querySelector('.lightbox-label');
const lightboxDesc = lightbox.querySelector('.lightbox-desc');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const thumb = item.querySelector('.gallery-thumb');
    const gtClass = [...thumb.classList].find(c => c.startsWith('gt-'));
    const kana = item.querySelector('.gallery-kana');

    lightboxVisual.className = 'lightbox-visual';
    if (gtClass) lightboxVisual.classList.add(gtClass);
    lightboxVisual.dataset.kana = kana ? kana.textContent : '';
    lightboxLabel.textContent = item.dataset.label || '';
    lightboxDesc.textContent = item.dataset.desc || '';

    lightbox.classList.add('open');
    lightbox.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close').focus();
  });
});

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// お問い合わせフォーム（ダミー送信処理）
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = '送信中…';
    btn.disabled = true;
    setTimeout(() => {
      alert('お問い合わせを受け付けました。\n後ほどご連絡いたします。');
      contactForm.reset();
      btn.textContent = original;
      btn.disabled = false;
    }, 1000);
  });
}
