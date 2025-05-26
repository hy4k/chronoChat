/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Prompts for the Daily Time Capsule - can be expanded
const dailyCapsulePrompts: string[] = [
  "If you joined a chatroom in the Renaissance as an 'Apprentice Artist', what's the first thing you'd ask Leonardo da Vinci?",
  "In a Cyberpunk 2077 chatroom, what kind of 'job' would your chosen role be looking for?",
  "Imagine a group chat during the Moon Landing. What would people with different roles (e.g., Mission Control, Reporter, Viewer) be saying?",
  "What 'modern' slang would be most confusing if you used it in an Ancient Egypt chatroom?",
  "If you could send one object back in time to yourself 10 years ago, what would it be and why?",
  "Describe a conversation with a robot from 2242. What's the most surprising thing it tells you about daily life?",
  "You're at a Victorian-era séance. What question do you ask the spirits?",
  "What's one piece of advice a wise old tree from an enchanted forest might give you?"
];


document.addEventListener('DOMContentLoaded', () => {
  const mysteryBox = document.getElementById('daily-mystery-box');
  const capsuleMessageContent = document.getElementById('daily-capsule-message-content');

  if (mysteryBox && capsuleMessageContent) {
    const displayDailyTimeCapsule = () => {
      const today = new Date().toISOString().split('T')[0]; 
      const storedDate = localStorage.getItem('chronoChatDailyCapsuleDate_landing');
      let storedContent = localStorage.getItem('chronoChatDailyCapsuleContent_landing');

      if (storedDate === today && storedContent) {
        capsuleMessageContent.textContent = storedContent;
      } else {
        const randomIndex = Math.floor(Math.random() * dailyCapsulePrompts.length);
        const newCapsuleContent = dailyCapsulePrompts[randomIndex];
        capsuleMessageContent.textContent = newCapsuleContent;
        localStorage.setItem('chronoChatDailyCapsuleDate_landing', today);
        localStorage.setItem('chronoChatDailyCapsuleContent_landing', newCapsuleContent);
      }
    };

    displayDailyTimeCapsule(); // Set the content initially (it's hidden by CSS)

    const revealMessage = () => {
      if (!mysteryBox.classList.contains('revealed')) {
        mysteryBox.classList.add('revealed');
        // Ensure the message is visible (CSS handles animation)
        capsuleMessageContent.style.display = 'block'; 
        mysteryBox.setAttribute('aria-label', capsuleMessageContent.textContent || "Today's revealed time capsule message");
      }
    };

    mysteryBox.addEventListener('click', revealMessage);
    mysteryBox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            revealMessage();
            event.preventDefault(); // Prevent page scroll on space
        }
    });

  } else {
    console.warn('Mystery box or capsule message content element not found.');
  }
});
