/**
 * Jellyfin Enhancement: Profile Dropdown
 * Dynamic quick-action menu scraped from #/mypreferencesmenu via hidden iframe.
 */
(function () {
  'use strict';

  let profileDropdown    = null;
  let profileMenuPromise = null; // kicked off at bootstrap, shared by all callers

  function waitForApiClient(cb) {
    if (window.ApiClient && window.ApiClient.getCurrentUserId && window.ApiClient.getCurrentUserId()) {
      cb();
    } else {
      setTimeout(() => waitForApiClient(cb), 300);
    }
  }

  /**
   * Load menu sections from #/mypreferencesmenu via a hidden iframe.
   * Returns a Promise<{ heading, links[] }[] | null>.
   * Calling this multiple times always returns the same Promise.
   */
  function loadProfileMenuItems() {
    if (profileMenuPromise) return profileMenuPromise;

    profileMenuPromise = new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;opacity:0;pointer-events:none;border:none;';
      iframe.src = `${window.location.origin}/web/#/mypreferencesmenu`;
      document.body.appendChild(iframe);

      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          // h2.headerUsername only exists once the preferences page has rendered
          if (doc.querySelectorAll('h2.headerUsername').length >= 1) {
            const sections = [];
            doc.querySelectorAll('.verticalSection').forEach(sec => {
              const h2 = sec.querySelector('h2.headerUsername');
              if (!h2) return;
              const links = Array.from(sec.querySelectorAll('a.emby-button[href]')).map(a => ({
                label:        a.querySelector('.listItemBodyText')?.textContent.trim() || a.textContent.trim().substring(0, 60),
                href:         a.getAttribute('href'),
                listItemHTML: a.querySelector('.listItem')?.outerHTML || '',
                isLogout:     a.classList.contains('btnLogout')
              })).filter(x => x.label);

              if (links.length) sections.push({ heading: h2.textContent.trim(), links });
            });
            clearInterval(timer);
            try { document.body.removeChild(iframe); } catch {}
            resolve(sections);
          }
        } catch { /* iframe not ready */ }

        if (attempts >= 40) {        // ~8 s timeout → fall back to static
          clearInterval(timer);
          try { document.body.removeChild(iframe); } catch {}
          resolve(null);
        }
      }, 200);
    });

    return profileMenuPromise;
  }

  function ensureProfileDropdown() {
    if (!document.getElementById('jf-profile-dropdown')) {
      const dd = document.createElement('div');
      dd.id = 'jf-profile-dropdown';
      document.body.appendChild(dd);
    }
    profileDropdown = document.getElementById('jf-profile-dropdown');
  }

  function renderProfileDropdown(sections) {
    if (!profileDropdown) return;
    profileDropdown.innerHTML = '';

    // Static fallback if iframe timed out
    if (!sections) {
      sections = [{
        heading: null,
        links: [
          { label: 'Einstellungen', href: '#/usersettings', listItemHTML: '<div class="listItem"><span class="material-icons listItemIcon listItemIcon-transparent settings" aria-hidden="true"></span><div class="listItemBody"><div class="listItemBodyText">Einstellungen</div></div></div>', isLogout: false },
          { label: 'Abmelden',      href: '#',              listItemHTML: '<div class="listItem"><span class="material-icons listItemIcon listItemIcon-transparent exit_to_app" aria-hidden="true"></span><div class="listItemBody"><div class="listItemBodyText">Abmelden</div></div></div>',      isLogout: true  }
        ]
      }];
    }

    sections.forEach((section, si) => {
      if (si > 0) {
        const hr = document.createElement('div');
        hr.style.cssText = 'height:1px;background:rgba(255,255,255,0.07);margin:6px 0;';
        profileDropdown.appendChild(hr);
      }

      if (section.heading) {
        const cap = document.createElement('div');
        cap.textContent = section.heading;
        cap.style.cssText = 'padding:6px 16px 4px;color:rgba(255,255,255,0.38);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;';
        profileDropdown.appendChild(cap);
      }

      section.links.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'cursor:pointer;transition:background 0.15s;white-space:nowrap;';
        row.innerHTML = item.listItemHTML;
        row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,0.08)');
        row.addEventListener('mouseleave', () => row.style.background = '');
        row.addEventListener('click', () => {
          hideProfile();
          if (item.isLogout) {
            window.ApiClient.logout().then(() => window.location.reload());
          } else {
            window.location.hash = item.href.replace(/^#/, '');
          }
        });
        profileDropdown.appendChild(row);
      });
    });
  }

  function hideProfile() {
    if (profileDropdown) profileDropdown.style.display = 'none';
  }

  function bindProfileButton() {
    const btn = document.querySelector('.headerUserButton');
    if (!btn || btn._jfProfile) return;
    btn._jfProfile = true;

    btn.addEventListener('click', async e => {
      e.stopImmediatePropagation();
      e.preventDefault();

      ensureProfileDropdown();

      if (profileDropdown.style.display !== 'none') {
        hideProfile();
        return;
      }

      // Position just below the button
      const rect = btn.getBoundingClientRect();
      profileDropdown.style.top   = (rect.bottom + 6) + 'px';
      profileDropdown.style.right = (window.innerWidth - rect.right) + 'px';
      profileDropdown.style.left  = 'auto';
      profileDropdown.style.display = 'block';

      const sections = await loadProfileMenuItems();
      renderProfileDropdown(sections);
    }, true);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideProfile();
  });

  document.addEventListener('mousedown', e => {
    if (profileDropdown?.style.display !== 'none') {
      const btn = document.querySelector('.headerUserButton');
      if (!profileDropdown.contains(e.target) && !btn?.contains(e.target)) {
        hideProfile();
      }
    }
  });

  waitForApiClient(() => {
    loadProfileMenuItems(); // preload in background — ready before first click
    ensureProfileDropdown();
    bindProfileButton();
    new MutationObserver(() => {
      const pb = document.querySelector('.headerUserButton');
      if (pb && !pb._jfProfile) bindProfileButton();
    }).observe(document.body, { childList: true, subtree: true });
  });

})();
