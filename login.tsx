/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const errorMessageElement = document.getElementById('login-error-message') as HTMLParagraphElement;

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
    } else {
      errorMessageElement.textContent = 'Invalid username or password. Please try again.';
      usernameInput.focus();
    }
  });
});
