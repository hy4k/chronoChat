"use strict";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessageElement = document.getElementById('login-error-message');
    // Redirect to main app if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
        return; // Stop further execution
    }
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        errorMessageElement.textContent = ''; // Clear previous errors
        const username = usernameInput.value.trim();
        const password = passwordInput.value; // No trim on password
        // Mock authentication
        if (username === 'user' && password === 'pass') {
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'index.html';
        }
        else {
            errorMessageElement.textContent = 'Invalid username or password. Please try again.';
            usernameInput.focus();
        }
    });
});
