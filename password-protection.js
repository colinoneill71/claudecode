/**
 * Password Protection Module for Case Studies
 * Provides client-side password protection with session persistence
 */

(function() {
    'use strict';

    const PASSCODE = 'oneill25';
    const SESSION_KEY = 'caseStudyAuth';
    const YOUR_EMAIL = 'colin@colinoneill.net';

    /**
     * Check if user is already authenticated in this session
     */
    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    }

    /**
     * Mark user as authenticated for this session
     */
    function setAuthenticated() {
        sessionStorage.setItem(SESSION_KEY, 'true');
    }

    /**
     * Create and show the password modal
     */
    function showPasswordModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'password-overlay';
        overlay.className = 'password-overlay';

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'password-modal';

        modal.innerHTML = `
            <div class="password-modal-content">
                <h2>Protected Case Study</h2>
                <p>This case study is password protected. Please enter the passcode to continue.</p>

                <form id="password-form">
                    <input
                        type="password"
                        id="password-input"
                        placeholder="Enter passcode"
                        autocomplete="off"
                        autofocus
                    />
                    <div id="error-message" class="error-message" style="display: none;">
                        Incorrect passcode. Please try again.
                    </div>
                    <button type="submit" class="submit-btn">Access Case Study</button>
                </form>

                <div class="request-access">
                    <p>Don't have a passcode?</p>
                    <a href="mailto:${YOUR_EMAIL}?subject=Request%20Case%20Study%20Access&body=Hi%20Colin,%0A%0AI'd%20like%20to%20request%20access%20to%20your%20case%20studies.%0A%0AThank%20you!"
                       class="request-btn">
                        Request Access via Email
                    </a>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Handle form submission
        const form = document.getElementById('password-form');
        const input = document.getElementById('password-input');
        const errorMsg = document.getElementById('error-message');

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const enteredPassword = input.value.trim();

            if (enteredPassword === PASSCODE) {
                // Correct password
                setAuthenticated();
                overlay.style.opacity = '0';
                setTimeout(function() {
                    overlay.remove();
                    revealContent();
                }, 300);
            } else {
                // Incorrect password
                errorMsg.style.display = 'block';
                input.value = '';
                input.focus();

                // Shake animation
                modal.classList.add('shake');
                setTimeout(function() {
                    modal.classList.remove('shake');
                }, 500);
            }
        });

        // Focus the input
        setTimeout(function() {
            input.focus();
        }, 100);
    }

    /**
     * Reveal the protected content
     */
    function revealContent() {
        document.body.classList.remove('content-hidden');
        document.body.classList.add('content-visible');
    }

    /**
     * Hide the protected content initially
     */
    function hideContent() {
        document.body.classList.add('content-hidden');
    }

    /**
     * Initialize password protection
     */
    function init() {
        if (isAuthenticated()) {
            // User already authenticated in this session
            revealContent();
        } else {
            // Hide content and show password modal
            hideContent();
            showPasswordModal();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
