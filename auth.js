// auth.js — Production Client-Side Google Authentication & Session Handler for INTALL
// Follows "Drafting Table" design system: Paper (#F5F2EA), Ink (#0E1A2B), Accent (#E4572E), max 4px radius, no emojis
(function () {
  'use strict';

  let currentUser = null;

  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.style.cssText = `
      background: ${isError ? '#0E1A2B' : '#0E1A2B'};
      color: #F5F2EA;
      padding: 10px 16px;
      border-radius: 2px;
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      box-shadow: 0 4px 16px rgba(14, 26, 43, 0.25);
      border: 1px solid ${isError ? '#C53030' : '#E4572E'};
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    toast.innerHTML = `
      <span style="color: ${isError ? '#C53030' : '#E4572E'}; font-weight: 700;">${isError ? '[!]' : '[+]'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4000);
  }

  function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login_success')) {
      showToast('Signed in successfully with Google');
      params.delete('login_success');
      const newQuery = params.toString() ? '?' + params.toString() : '';
      window.history.replaceState({}, document.title, window.location.pathname + newQuery + window.location.hash);
    } else if (params.get('auth_error')) {
      const err = params.get('auth_error');
      showToast('Authentication rejected: ' + decodeURIComponent(err), 'error');
      params.delete('auth_error');
      const newQuery = params.toString() ? '?' + params.toString() : '';
      window.history.replaceState({}, document.title, window.location.pathname + newQuery + window.location.hash);
    }
  }

  // Account Deletion Modal
  function showAccountDeletionModal(user) {
    let modal = document.getElementById('accountDeleteModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'accountDeleteModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'deleteModalTitle');
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(14, 26, 43, 0.72);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      `;
      modal.innerHTML = `
        <div style="
          background: #F5F2EA;
          border: 1px solid #D8D2C5;
          max-width: 460px;
          width: 100%;
          padding: 28px;
          border-radius: 2px;
          box-shadow: 0 8px 32px rgba(14, 26, 43, 0.3);
          font-family: 'Inter', sans-serif;
          color: #0E1A2B;
        ">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #E4572E; margin-bottom: 8px;">
            § PRIVACY / RIGHT TO ERASURE
          </div>
          <h3 id="deleteModalTitle" style="font-family: 'Fraunces', serif; font-size: 22px; margin-bottom: 12px; color: #0E1A2B;">
            Purge Account & Saved Plans
          </h3>
          <p style="font-size: 14px; color: #536278; line-height: 1.5; margin-bottom: 20px;">
            Are you sure you want to permanently delete your INTALL account (<strong>${user.email}</strong>)? All session clearances and plan records stored on the server will be immediately erased. This action cannot be undone.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" id="cancelDeleteBtn" style="
              min-height: 40px;
              padding: 0 16px;
              background: #FAF8F3;
              border: 1px solid #D8D2C5;
              border-radius: 2px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              text-transform: uppercase;
              color: #0E1A2B;
              cursor: pointer;
            ">Cancel</button>
            <button type="button" id="confirmDeleteBtn" style="
              min-height: 40px;
              padding: 0 16px;
              background: #C53030;
              border: 1px solid #C53030;
              border-radius: 2px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              text-transform: uppercase;
              color: #FFFFFF;
              font-weight: 600;
              cursor: pointer;
            ">Confirm & Purge</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#cancelDeleteBtn').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.querySelector('#confirmDeleteBtn').addEventListener('click', async () => {
        try {
          const res = await fetch('/api/auth/delete-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': user.csrfToken || ''
            }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast('Account permanently erased.');
            setTimeout(() => {
              window.location.href = '/signin';
            }, 800);
          } else {
            showToast(data.error || 'Account purge failed', 'error');
          }
        } catch (e) {
          showToast('Failed to reach server: ' + e.message, 'error');
        }
      });
    } else {
      modal.style.display = 'flex';
    }
  }

  function renderAuthUI(user) {
    const containers = document.querySelectorAll('.auth-nav-slot, #authNavContainer');
    if (!containers.length) return;

    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);

    containers.forEach(container => {
      if (user) {
        // Authenticated State with Drafting Table Profile & Settings Menu Stub
        const firstName = user.given_name || (user.name ? user.name.split(' ')[0] : 'Architect');
        const avatarUrl = user.picture || '';

        container.style.position = 'relative';
        container.innerHTML = `
          <div style="position: relative; display: inline-block;">
            <button type="button" id="intallProfileBadge" aria-haspopup="true" aria-expanded="false" style="
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: #FAF8F3;
              padding: 4px 10px 4px 6px;
              border-radius: 2px;
              border: 1px solid #D8D2C5;
              font-family: 'JetBrains Mono', monospace;
              cursor: pointer;
              transition: all 0.15s ease;
            ">
              ${avatarUrl ? `
                <img src="${avatarUrl}" alt="${user.name || 'Architect'}" referrerpolicy="no-referrer" style="
                  width: 22px;
                  height: 22px;
                  border-radius: 2px;
                  object-fit: cover;
                  border: 1px solid #0E1A2B;
                " onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
                <span style="display:none; width: 22px; height: 22px; border-radius: 2px; background: #0E1A2B; color: #F5F2EA; font-size: 11px; font-weight: 700; align-items: center; justify-content: center;">
                  ${firstName.charAt(0).toUpperCase()}
                </span>
              ` : `
                <span style="width: 22px; height: 22px; border-radius: 2px; background: #0E1A2B; color: #F5F2EA; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;">
                  ${firstName.charAt(0).toUpperCase()}
                </span>
              `}
              <span style="font-size: 12px; font-weight: 600; color: #0E1A2B; text-transform: uppercase;">${firstName}</span>
              <span style="font-size: 10px; color: #536278;">▼</span>
            </button>

            <!-- Drafting Table Settings Popover Menu Stub -->
            <div id="intallSettingsDropdown" style="
              display: none;
              position: absolute;
              top: calc(100% + 6px);
              right: 0;
              background: #FAF8F3;
              border: 1px solid #D8D2C5;
              border-radius: 2px;
              width: 240px;
              box-shadow: 0 6px 20px rgba(14, 26, 43, 0.15);
              z-index: 9999;
              font-family: 'JetBrains Mono', monospace;
              padding: 8px 0;
            ">
              <div style="padding: 8px 12px; border-bottom: 1px solid #D8D2C5; margin-bottom: 4px;">
                <div style="font-size: 10px; color: #E4572E; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">§ ARCHITECT PROFILE</div>
                <div style="font-size: 12px; font-weight: 700; color: #0E1A2B; margin-top: 2px;">${user.name || firstName}</div>
                <div style="font-size: 11px; color: #536278; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.email || ''}</div>
              </div>

              <a href="/index.html" style="display: block; padding: 7px 12px; font-size: 11px; text-transform: uppercase; color: #0E1A2B; text-decoration: none; transition: background 0.1s;" onmouseover="this.style.background='#F5F2EA'" onmouseout="this.style.background='transparent'">
                Studio Drawing Board
              </a>
              <a href="/admin" style="display: block; padding: 7px 12px; font-size: 11px; text-transform: uppercase; color: #E4572E; font-weight: 700; text-decoration: none; transition: background 0.1s;" onmouseover="this.style.background='#F5F2EA'" onmouseout="this.style.background='transparent'">
                ⚙ Admin Dashboard
              </a>
              <a href="/terms.html" style="display: block; padding: 7px 12px; font-size: 11px; text-transform: uppercase; color: #536278; text-decoration: none; transition: background 0.1s;" onmouseover="this.style.background='#F5F2EA'" onmouseout="this.style.background='transparent'">
                Terms of Service
              </a>
              <a href="/privacy.html" style="display: block; padding: 7px 12px; font-size: 11px; text-transform: uppercase; color: #536278; text-decoration: none; transition: background 0.1s;" onmouseover="this.style.background='#F5F2EA'" onmouseout="this.style.background='transparent'">
                Privacy Policy
              </a>

              <div style="border-top: 1px solid #D8D2C5; margin: 4px 0;"></div>

              <a href="/auth/logout?returnTo=${returnTo}" style="display: block; padding: 7px 12px; font-size: 11px; text-transform: uppercase; color: #0E1A2B; text-decoration: none; transition: background 0.1s;" onmouseover="this.style.background='#F5F2EA'" onmouseout="this.style.background='transparent'">
                Sign Out
              </a>

              <!-- Account Deletion Path in Settings Menu Stub -->
              <button type="button" id="triggerDeleteAccountBtn" style="
                width: 100%;
                text-align: left;
                padding: 7px 12px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 11px;
                text-transform: uppercase;
                color: #C53030;
                background: none;
                border: none;
                cursor: pointer;
                border-top: 1px solid #D8D2C5;
                margin-top: 4px;
                transition: background 0.1s;
              " onmouseover="this.style.background='#F5F2EA'" onmouseout="this.style.background='none'">
                Purge Account & Plans
              </button>
            </div>
          </div>
        `;

        const badgeBtn = container.querySelector('#intallProfileBadge');
        const dropdown = container.querySelector('#intallSettingsDropdown');
        const deleteBtn = container.querySelector('#triggerDeleteAccountBtn');

        if (badgeBtn && dropdown) {
          badgeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            badgeBtn.setAttribute('aria-expanded', !isOpen);
          });

          document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
              dropdown.style.display = 'none';
              badgeBtn.setAttribute('aria-expanded', 'false');
            }
          });
        }

        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = 'none';
            showAccountDeletionModal(user);
          });
        }

      } else {
        // Unauthenticated State (Drafting Table Google Sign-In Link)
        const isFile = window.location.protocol === 'file:';
        container.innerHTML = `
          <a href="${isFile ? 'javascript:void(0)' : `/auth/google?returnTo=${returnTo}`}" class="intall-google-login-btn" title="Sign in with Google" style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #FFFFFF;
            color: #0E1A2B;
            border: 1px solid #D8D2C5;
            border-radius: 2px;
            padding: 6px 14px;
            font-size: 12px;
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
          " onmouseover="this.style.borderColor='#0E1A2B'; this.style.background='#FAF8F3';" onmouseout="this.style.borderColor='#D8D2C5'; this.style.background='#FFFFFF';">
            <svg width="14" height="14" viewBox="0 0 24 24" style="flex-shrink: 0;" aria-hidden="true" focusable="false">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign In</span>
          </a>
        `;

        if (isFile) {
          const btn = container.querySelector('.intall-google-login-btn');
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              showToast('Google Sign-In requires the local server. Run "node server.js" & open http://localhost:8000', 'error');
            });
          }
        }
      }
    });
  }

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Auth check failed');
      const data = await res.json();
      currentUser = data.authenticated ? data.user : null;
      window.INTALL_USER = currentUser;
      renderAuthUI(currentUser);
      window.dispatchEvent(new CustomEvent('intall:auth-changed', { detail: { user: currentUser } }));

      // Enforce auth gate: Unauthenticated users cannot view 3D Studio or Home
      if (!currentUser && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('home.html') || window.location.pathname === '/')) {
        const nextTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/signin?next=${nextTarget}`;
      }
    } catch (e) {
      currentUser = null;
      window.INTALL_USER = null;
      renderAuthUI(null);

      if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('home.html') || window.location.pathname === '/') {
        const nextTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/signin?next=${nextTarget}`;
      }
    }
  }

  function init() {
    handleUrlParams();
    checkAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.INTALL_AUTH = {
    checkAuth,
    getUser: () => currentUser,
    login: (returnTo) => {
      if (window.location.protocol === 'file:') {
        showToast('Google Sign-In requires the local server. Run "node server.js" & open http://localhost:8000', 'error');
        return;
      }
      const target = returnTo || window.location.pathname;
      window.location.href = `/auth/google?returnTo=${encodeURIComponent(target)}`;
    },
    logout: (returnTo) => {
      const target = returnTo || window.location.pathname;
      window.location.href = `/auth/logout?returnTo=${encodeURIComponent(target)}`;
    },
    deleteAccount: () => {
      if (currentUser) {
        showAccountDeletionModal(currentUser);
      }
    }
  };
})();
