
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import * as marked from 'marked';

(function() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const currentPath = window.location.pathname;
  const isMainAppPage = currentPath.endsWith('index.html') || currentPath === '/' || /\/app\/?$/.test(currentPath) || currentPath.endsWith('/app');


  if (!isLoggedIn && isMainAppPage) {
    window.location.href = 'login.html';
    if (document.body) {
        document.body.innerHTML = `<p style="font-family: 'Roboto', sans-serif; color: #E0E0E0; background-color: #0D0E1A; text-align: center; padding: 3em; font-size: 1.2em; min-height: 100vh; margin:0; display:flex; align-items:center; justify-content:center;">Redirecting to login page...</p>`;
    } else {
        console.warn("document.body not available for redirect message. Redirecting to login.");
    }
    return; 
  }

  // Safely access process.env.API_KEY
  const GEMINI_API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
                         ? process.env.API_KEY 
                         : undefined;
  const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
  const IMAGEN_MODEL_NAME = 'imagen-3.0-generate-002';
  const GENERAL_ERA_AI_ID = 'general_era_ai';

  interface AIPersona {
    id: string;
    name: string;
    systemInstructionPrompt: string;
    welcomeMessage: string;
  }

  interface UserRole {
    id: string;
    name: string;
    description: string;
  }

  interface EraDetail {
    name: string;
    description: string;
    initialPromptContext: string; 
    imagePromptSubject?: string;
    aiPersonas?: AIPersona[];
    userRoles: UserRole[];
    mockEraParticipants?: Array<{ id: string, name: string, roleId: string, description?: string, welcomeMessage?: string }>;
  }

  const eraDetails: Record<string, EraDetail> = {
    'ancient-egypt': {
      name: 'Ancient Egypt (1350 BCE)',
      description: 'Explore the land of Pharaohs and Pyramids during the reign of Akhenaten.',
      initialPromptContext: "You are in Ancient Egypt, around 1350 BCE, during the Amarna period. Akhenaten's monotheistic worship of Aten is prominent. The capital city is Akhetaten.",
      imagePromptSubject: "the majestic temples and sun-baked sands of Akhetaten in Ancient Egypt, 1350 BCE",
      userRoles: [
        { id: 'royal-scribe', name: 'Royal Scribe', description: 'Records events and manages temple documents.'},
        { id: 'artisan-baker', name: 'Artisan Baker', description: 'Prepares bread and goods for the city.'},
        { id: 'aten-devotee', name: 'Aten Devotee', description: 'A common citizen embracing the new faith.'},
      ],
      aiPersonas: [
        {
          id: 'high-priestess-meritaten',
          name: 'High Priestess Meritaten',
          systemInstructionPrompt: "You are Meritaten, a High Priestess of Aten in Akhetaten, 1350 BCE. You are a devout follower of Akhenaten's reforms. Speak with wisdom, spirituality, and a deep understanding of Aten worship, Egyptian rituals, and daily life in the royal city. You are talking to a curious visitor who seems to have appeared from nowhere. Be cautious but willing to share insights about your faith and your time.",
          welcomeMessage: "Blessings of Aten upon you, traveler. I am Meritaten, High Priestess in service to the One True God. You seem... unfamiliar. What brings you to Akhetaten, the city of the Sun Disc's light?"
        }
      ],
      mockEraParticipants: [
        { id: "bek-baker", name: "Bek", roleId: "artisan-baker", welcomeMessage: "Greetings! The aroma of fresh bread welcomes you. I am Bek. What brings you to my humble bakery?" },
        { id: "nefer-devotee", name: "Nefer", roleId: "aten-devotee", welcomeMessage: "Praise Aten! It is good to see a new face in Akhetaten. I am Nefer." }
      ]
    },
    'renaissance-europe': {
      name: 'Renaissance Europe (Florence, 1505 CE)',
      description: 'Witness the rebirth of art and science in Florence, Italy.',
      initialPromptContext: "You are in Florence, Italy, around 1505 CE. Leonardo da Vinci is working on the Mona Lisa, and Michelangelo has recently completed his David statue. The city is a hub of artistic and intellectual activity.",
      imagePromptSubject: "a bustling Florentine street or an artist's workshop during the Renaissance in 1505 CE",
      userRoles: [
        { id: 'apprentice-artist', name: 'Apprentice Artist', description: 'Learning from a master in a bustling workshop.' },
        { id: 'merchant-patron', name: 'Merchant Patron', description: 'Wealthy trader seeking to commission great art.' },
        { id: 'scholar-humanist', name: 'Scholar Humanist', description: 'Discussing philosophy and classical texts.'}
      ],
      aiPersonas: [
        {
          id: 'leonardo-da-vinci',
          name: 'Leonardo da Vinci',
          systemInstructionPrompt: "You are Leonardo da Vinci, the Renaissance polymath, in Florence around 1505. Speak with boundless curiosity, intellectual depth, and an artistic flair. You are knowledgeable about art, anatomy, engineering, and philosophy of your time. You are currently pondering your latest inventions and artistic commissions, like the Mona Lisa. Respond to the user as if they are an inquisitive visitor to your workshop or a fellow thinker of the period. Be observant and perhaps a little enigmatic.",
          welcomeMessage: "Ah, a new face in Firenze! Buon giorno. I am Leonardo. You find me amidst my studies and creations. What curiosities or inquiries bring you to my attention today?"
        }
      ],
      mockEraParticipants: [
        { id: "giovanni-apprentice", name: "Giovanni", roleId: "apprentice-artist", welcomeMessage: "Welcome to the workshop! I'm Giovanni, learning from the Maestro. Are you here to see his latest work?"},
        { id: "isabella-patron", name: "Isabella", roleId: "merchant-patron", welcomeMessage: "Salutations. I am Isabella. Florence is alive with genius, wouldn't you agree? Perhaps you have an eye for fine art?"}
      ]
    },
     'moon-landing-1969': {
      name: 'Moon Landing (July 20, 1969)',
      description: 'Experience the historic Apollo 11 Moon Landing.',
      initialPromptContext: "It's July 20, 1969. You are witnessing the Apollo 11 mission. Neil Armstrong and Buzz Aldrin are about to walk on the Moon. The world is watching.",
      imagePromptSubject: "the Apollo 11 lunar module on the surface of the Moon, July 20, 1969, with Earth in the sky",
      userRoles: [
        { id: 'mission-control', name: 'Mission Control Staffer', description: 'Monitoring data at NASA during the landing.'},
        { id: 'news-reporter', name: 'News Reporter', description: 'Covering the historic event for global news.'},
        { id: 'family-viewer', name: 'Family Member Watching', description: 'Experiencing the landing from home on TV.'}
      ],
       mockEraParticipants: [
        { id: "walter-reporter", name: "Walter (Reporter)", roleId: "news-reporter", welcomeMessage: "What a day! History in the making. Are you as thrilled as I am about this giant leap?" },
      ]
    },
    'cyberpunk-2077': {
      name: 'Cyberpunk Neo-City (2077 CE)',
      description: 'Navigate the neon-lit streets of a technologically advanced, dystopian future.',
      initialPromptContext: "You are in Neo-Kyoto, a sprawling cyberpunk metropolis in the year 2077. Megacorporations wield immense power, cybernetic enhancements are common, and the digital world bleeds into reality.",
      imagePromptSubject: "a neon-drenched, rain-slicked street in the cyberpunk metropolis of Neo-Kyoto in 2077, with towering skyscrapers and holographic advertisements",
      userRoles: [
        { id: 'street-samurai', name: 'Street Samurai (Merc)', description: 'A freelance operative navigating the dangerous streets.'},
        { id: 'corp-agent', name: 'Corporate Agent', description: 'Working for a megacorp, playing the power games.'},
        { id: 'info-broker', name: 'Info Broker (Netrunner)', description: 'Dealing in secrets and data in the digital depths.'}
      ],
       mockEraParticipants: [
        { id: "rogue-samurai", name: "Rogue (Street Samurai)", roleId: "street-samurai", welcomeMessage: "Need something done in Neo-Kyoto? Or just admiring the chrome? Name's Rogue." },
        { id: "zero-broker", name: "Zero (Info Broker)", roleId: "info-broker", welcomeMessage: "Data streams are flowing... What secrets do you seek in this city of shadows, choom?" }
      ]
    },
    'climate-summit-2050': {
      name: 'Global Climate Summit (2050 CE)',
      description: 'Participate in critical discussions about Earth\'s future at a global summit.',
      initialPromptContext: "The year is 2050. You are attending a critical Global Climate Summit in a technologically advanced, eco-conscious city. World leaders and scientists are debating urgent solutions to climate change.",
      imagePromptSubject: "a futuristic, sustainable city hosting the Global Climate Summit in 2050, with innovative green technologies visible",
      userRoles: [
        { id: 'lead-scientist', name: 'Lead Climate Scientist', description: 'Presenting research and solutions.'},
        { id: 'diplomat-negotiator', name: 'Diplomat & Negotiator', description: 'Working towards international agreements.'},
        { id: 'youth-activist', name: 'Youth Climate Activist', description: 'Advocating for future generations.'}
      ],
      mockEraParticipants: [
        { id: "dr-aris-scientist", name: "Dr. Aris (Scientist)", roleId: "lead-scientist", welcomeMessage: "Welcome to the Summit. The data is clear, and the time for action is now. What are your thoughts on our planet's future?" },
        { id: "lena-activist", name: "Lena (Activist)", roleId: "youth-activist", welcomeMessage: "Our future is on the line. It's good to see more people engaged. Are you here to help make a difference?" }
      ]
    }
  };

  type ChatMode = 'learn' | 'dm' | 'group';

  class ChronoChatApp {
    private ai: GoogleGenAI;

    private modeSelectionContainer: HTMLElement;
    private chatInterfaceContainer: HTMLElement;
    private backToModeSelectButton: HTMLButtonElement;
    
    private eraSelect: HTMLSelectElement;
    private aiPersonaSelect: HTMLSelectElement;
    private aiPersonaSelectorContainer: HTMLElement;
    private roleSelect: HTMLSelectElement;
    
    private chatMessagesContainer: HTMLElement;
    private chatInput: HTMLInputElement;
    private sendButton: HTMLButtonElement;
    private chatForm: HTMLFormElement;
    private chatLoadingIndicator: HTMLElement;
    
    private snapshotButton: HTMLButtonElement;
    private snapshotLoadingIndicator: HTMLElement;
    private snapshotModal: HTMLElement;
    private snapshotImage: HTMLImageElement;
    private snapshotModalTitle: HTMLElement;
    private snapshotModalCloseButton: HTMLButtonElement;
    private snapshotShareButton: HTMLButtonElement;

    private logoutButton: HTMLButtonElement;

    private chatroomInfoBar: HTMLElement;
    private currentChatroomNameDisplay: HTMLElement;
    private currentUserRoleDisplay: HTMLElement;
    private participantsList: HTMLElement;

    private currentView: 'modeSelection' | 'chatInterface' = 'modeSelection';
    private currentChatMode: ChatMode | null = null;
    private currentEraKey: string | null = null;
    private currentAIPersonaId: string | null = null; 
    private currentUserRoleKey: string | null = null;
    private currentMockParticipantId: string | null = null;

    private chatHistory: { role: 'user' | 'model'; parts: {text: string}[] }[] = []; 
    
    private activeChatContext: {
        type: 'group' | 'dm-ai' | 'dm-mock';
        participantId?: string; 
        participantName?: string;
        participantRole?: string; 
    } | null = null;


    constructor() {
      if (!GEMINI_API_KEY) {
        this.displayFatalError('API_KEY is not configured. Please set the API_KEY environment variable. This key needs to be accessible to the client-side script, often via a build process or server-side configuration.');
        throw new Error('API_KEY not configured.');
      }
      this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      this.modeSelectionContainer = document.getElementById('mode-selection-container') as HTMLElement;
      this.chatInterfaceContainer = document.getElementById('chat-interface-container') as HTMLElement;
      this.logoutButton = document.getElementById('logout-button') as HTMLButtonElement;

      // Critical element checks
      if (!this.modeSelectionContainer) {
        this.displayFatalError('CRITICAL ERROR: The mode selection screen (mode-selection-container) is missing from the HTML. App cannot start.');
        throw new Error('mode-selection-container not found in HTML.');
      }
      if (!this.chatInterfaceContainer) {
        this.displayFatalError('CRITICAL ERROR: The chat interface screen (chat-interface-container) is missing from the HTML. App cannot start.');
        throw new Error('chat-interface-container not found in HTML.');
      }
       if (!this.logoutButton) {
        this.displayFatalError('CRITICAL ERROR: The logout button (logout-button) is missing from the HTML. App cannot start reliably.');
        throw new Error('logout-button not found in HTML.');
      }


      this.backToModeSelectButton = document.getElementById('back-to-mode-select') as HTMLButtonElement;
      this.eraSelect = document.getElementById('era-select') as HTMLSelectElement;
      this.aiPersonaSelect = document.getElementById('ai-persona-select') as HTMLSelectElement;
      this.aiPersonaSelectorContainer = document.getElementById('ai-persona-selector-container') as HTMLElement;
      this.roleSelect = document.getElementById('role-select') as HTMLSelectElement;
      
      this.chatMessagesContainer = document.getElementById('chat-messages') as HTMLElement;
      this.chatInput = document.getElementById('chat-input') as HTMLInputElement;
      this.sendButton = document.getElementById('send-button') as HTMLButtonElement;
      this.chatForm = document.getElementById('chat-form') as HTMLFormElement;
      this.chatLoadingIndicator = document.getElementById('loading-indicator') as HTMLElement;

      this.snapshotButton = document.getElementById('snapshot-button') as HTMLButtonElement;
      this.snapshotLoadingIndicator = document.getElementById('snapshot-loading-indicator') as HTMLElement;
      this.snapshotModal = document.getElementById('snapshot-modal') as HTMLElement;
      this.snapshotImage = document.getElementById('snapshot-image') as HTMLImageElement;
      this.snapshotModalTitle = document.getElementById('snapshot-modal-title') as HTMLElement;
      this.snapshotModalCloseButton = document.getElementById('snapshot-modal-close-button') as HTMLButtonElement;
      this.snapshotShareButton = document.getElementById('snapshot-share-button') as HTMLButtonElement;


      this.chatroomInfoBar = document.getElementById('chatroom-info-bar') as HTMLElement;
      this.currentChatroomNameDisplay = document.getElementById('current-chatroom-name') as HTMLElement;
      this.currentUserRoleDisplay = document.getElementById('current-user-role') as HTMLElement;
      this.participantsList = document.getElementById('participants-list') as HTMLElement;

      // Check for other essential elements that might cause issues if missing
      if (!this.backToModeSelectButton || !this.eraSelect || !this.aiPersonaSelect || !this.roleSelect || 
          !this.chatMessagesContainer || !this.chatInput || !this.sendButton || !this.chatForm) {
          console.warn("One or more non-critical UI elements for chat interaction are missing. Some functionality might be impaired.");
      }

      this.initEventListeners();
      this.renderCurrentView(); 
      this.disableChatFunctionality(); 
    }

    private initEventListeners(): void {
      document.querySelectorAll('.mode-select-button').forEach(button => {
        button.addEventListener('click', (e) => {
          console.log('Mode select button clicked'); 
          const card = (e.target as HTMLElement).closest('.mode-card');
          if (card instanceof HTMLElement && card.dataset.mode) {
            this.handleModeSelection(card.dataset.mode as ChatMode);
          } else {
            console.error('Could not find mode card or mode data for clicked button.', e.target);
          }
        });
      });
      
      if (this.backToModeSelectButton) {
        this.backToModeSelectButton.addEventListener('click', this.showModeSelectionView.bind(this));
      } else {
        console.error("Back to Mode Select button not found, cannot attach listener.");
      }

      if (this.logoutButton) {
        this.logoutButton.addEventListener('click', this.handleLogout.bind(this));
      } 

      if(this.eraSelect) this.eraSelect.addEventListener('change', this.handleEraChange.bind(this));
      if(this.roleSelect) this.roleSelect.addEventListener('change', this.handleRoleChange.bind(this));
      if(this.aiPersonaSelect) this.aiPersonaSelect.addEventListener('change', this.handleParticipantOrAIPersonaChange.bind(this));
      if(this.chatForm) this.chatForm.addEventListener('submit', this.handleSendMessage.bind(this));
      if(this.snapshotButton) this.snapshotButton.addEventListener('click', this.handleTakeSnapshot.bind(this));
      if(this.snapshotModalCloseButton) this.snapshotModalCloseButton.addEventListener('click', this.hideSnapshotModal.bind(this));
      if(this.snapshotShareButton) this.snapshotShareButton.addEventListener('click', this.handleShareSnapshot.bind(this));
      if(this.snapshotModal) this.snapshotModal.addEventListener('click', (event) => {
          if (event.target === this.snapshotModal) this.hideSnapshotModal();
      });
      if(this.participantsList) this.participantsList.addEventListener('click', this.handleParticipantClickFromList.bind(this));
    }

    private renderCurrentView(): void {
      console.log(`Rendering view: ${this.currentView}`); 
      if (!this.modeSelectionContainer || !this.chatInterfaceContainer) {
        console.error("Cannot render view: core containers are missing.");
        this.displayFatalError("Core UI containers are missing, cannot switch views.");
        return;
      }

      if (this.currentView === 'modeSelection') {
        this.modeSelectionContainer.style.display = 'flex';
        this.chatInterfaceContainer.style.display = 'none';
      } else { 
        this.modeSelectionContainer.style.display = 'none';
        this.chatInterfaceContainer.style.display = 'block';
      }
      this.updateChatroomInfoDisplays();
    }

    private showModeSelectionView(): void {
        console.log('Showing mode selection view'); 
        this.currentView = 'modeSelection';
        this.currentChatMode = null;
        this.currentEraKey = null;
        this.currentUserRoleKey = null;
        this.currentAIPersonaId = null;
        this.currentMockParticipantId = null;
        this.activeChatContext = null;
        
        this.resetChatSelectionsAndUI(); 
        this.renderCurrentView();
    }
    
    private handleModeSelection(mode: ChatMode): void {
      console.log(`Handling mode selection: ${mode}`); 
      this.currentChatMode = mode;
      this.currentView = 'chatInterface';

      this.resetChatSelectionsAndUI();    
      this.configureSelectorsForMode();   
    
      this.renderCurrentView();          
      
      if (this.eraSelect) this.eraSelect.focus();
      this.updateSystemMessage(`Mode selected: ${mode.toUpperCase()}. Please choose your destination.`);
    }

    private configureSelectorsForMode(): void {
        if (!this.eraSelect || !this.roleSelect || !this.aiPersonaSelect || !this.aiPersonaSelectorContainer) {
            console.warn("Cannot configure selectors: one or more selector elements are missing.");
            return;
        }

        this.eraSelect.disabled = false; 
        this.roleSelect.innerHTML = '<option value="">-- Select Era First --</option>';
        this.roleSelect.value = '';
        this.roleSelect.disabled = true; 
        
        this.aiPersonaSelect.innerHTML = '<option value="">-- Select Era & Role First --</option>';
        this.aiPersonaSelect.value = '';
        this.aiPersonaSelect.disabled = true;
        this.aiPersonaSelectorContainer.style.display = 'none';

        if (!this.currentChatMode) return;

        const aiPersonaLabel = this.aiPersonaSelectorContainer.querySelector('label');
        if (!aiPersonaLabel) {
            console.warn("AI Persona selector label not found.");
            return;
        }

        switch (this.currentChatMode) {
            case 'learn':
                this.aiPersonaSelectorContainer.style.display = 'block';
                aiPersonaLabel.textContent = 'Chat with AI Guide/Persona:';
                break;
            case 'dm':
                this.aiPersonaSelectorContainer.style.display = 'block';
                aiPersonaLabel.textContent = 'Chat with Character:';
                break;
            case 'group':
                this.aiPersonaSelectorContainer.style.display = 'none';
                break;
        }
      
        if (this.currentEraKey && eraDetails[this.currentEraKey]) {
            this.populateRoleSelector(); 
            if (this.currentUserRoleKey && eraDetails[this.currentEraKey].userRoles.find(r => r.id === this.currentUserRoleKey)) {
                 this.populateParticipantOrAIPersonaSelector(); 
            }
        }
    }
    
    private resetChatSelectionsAndUI(): void {
        if (this.chatMessagesContainer) this.chatMessagesContainer.innerHTML = '';
        this.chatHistory = [];
        
        if (this.eraSelect) this.eraSelect.value = ''; 
        
        if (this.roleSelect) {
            this.roleSelect.innerHTML = '<option value="">-- Select an Era First --</option>';
            this.roleSelect.value = '';
            this.roleSelect.disabled = true;
        }

        if (this.aiPersonaSelect) {
            this.aiPersonaSelect.innerHTML = '<option value="">-- Select Era & Role First --</option>';
            this.aiPersonaSelect.value = '';
            this.aiPersonaSelect.disabled = true;
        }
        
        this.disableChatFunctionality(); 
        this.updateChatroomInfoDisplays(); 
        if (this.participantsList) {
            this.participantsList.innerHTML = '<p class="system-message">Configure your session to see participants.</p>'; 
        }
    }


    private updateSystemMessage(message: string): void {
        if (!this.chatMessagesContainer) return;
        const existingSystemMessages = this.chatMessagesContainer.querySelectorAll('.system-message.interactive-status');
        existingSystemMessages.forEach(msg => msg.remove());

        const systemMessageElement = document.createElement('p');
        systemMessageElement.classList.add('system-message', 'interactive-status');
        systemMessageElement.textContent = message;
        this.chatMessagesContainer.insertBefore(systemMessageElement, this.chatMessagesContainer.firstChild);
    }

    private handleLogout(): void {
      console.log('Handling logout'); 
      localStorage.removeItem('isLoggedIn');
      window.location.href = 'landing.html';
    }

    private disableChatFunctionality(disableAllSelectors = false): void {
      if (this.chatInput) this.chatInput.disabled = true;
      if (this.sendButton) this.sendButton.disabled = true;
      if (this.snapshotButton) this.snapshotButton.disabled = true; 
      if (disableAllSelectors) {
          if (this.eraSelect) this.eraSelect.disabled = true;
          if (this.roleSelect) this.roleSelect.disabled = true;
          if (this.aiPersonaSelect) this.aiPersonaSelect.disabled = true;
      }
    }

    private enableChatFunctionality(): void {
      if (this.chatInput) this.chatInput.disabled = false;
      if (this.sendButton) this.sendButton.disabled = false;
      if (this.snapshotButton) this.snapshotButton.disabled = false;
      if (this.chatInput) this.chatInput.focus();
    }
    
    private updateChatroomInfoDisplays(): void {
        if (!this.currentChatroomNameDisplay || !this.currentUserRoleDisplay) return;

        if (this.currentEraKey && eraDetails[this.currentEraKey]) {
            const era = eraDetails[this.currentEraKey];
            this.currentChatroomNameDisplay.textContent = `Chatroom: ${era.name}`;
            if (this.currentUserRoleKey && era.userRoles.find(r => r.id === this.currentUserRoleKey)) {
                const role = era.userRoles.find(r => r.id === this.currentUserRoleKey);
                this.currentUserRoleDisplay.textContent = `Your Role: ${role ? role.name : 'Not Selected'}`;
            } else {
                this.currentUserRoleDisplay.textContent = `Your Role: Not Selected`;
            }
        } else {
            this.currentChatroomNameDisplay.textContent = `Chatroom: Not Selected`;
            this.currentUserRoleDisplay.textContent = `Your Role: Not Selected`;
        }

        if (this.currentView === 'chatInterface' && this.currentEraKey && this.currentUserRoleKey && eraDetails[this.currentEraKey]) {
            this.populateParticipantsListDisplay();
        } else {
            if (this.participantsList) this.participantsList.innerHTML = '<p class="system-message">Configure your session to see participants.</p>';
        }
    }

    private displayFatalError(message: string): void {
      console.error("FATAL ERROR:", message); 
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.innerHTML = `<p class="fatal-error" style="color: var(--error-color); text-align: center; padding: 2em; font-size: 1.2em; background-color: var(--app-bg); border: 2px solid var(--error-color); border-radius: 8px;">${message}</p>`;
      } else {
        document.body.innerHTML = `<p style="font-family: 'Roboto', sans-serif; color: #E0E0E0; background-color: #0D0E1A; text-align: center; padding: 3em; font-size: 1.2em; min-height: 100vh; margin:0; display:flex; align-items:center; justify-content:center;">FATAL ERROR: ${message}. Essential UI elements might be missing.</p>`;
      }
    }

    private async handleEraChange(): Promise<void> {
      if (!this.eraSelect || !this.roleSelect || !this.aiPersonaSelect) return;
      this.currentEraKey = this.eraSelect.value;
      this.currentUserRoleKey = null;
      this.currentAIPersonaId = null;
      this.currentMockParticipantId = null;
      this.activeChatContext = null;
      this.chatHistory = [];
      if (this.chatMessagesContainer) this.chatMessagesContainer.innerHTML = ''; 

      if (!this.currentEraKey) {
        this.updateSystemMessage('Please select a destination.');
        this.roleSelect.innerHTML = '<option value="">-- Select Era First --</option>';
        this.roleSelect.disabled = true;
        this.aiPersonaSelect.innerHTML = '<option value="">-- Select Era First --</option>';
        this.aiPersonaSelect.disabled = true;
        this.disableChatFunctionality();
      } else {
        this.populateRoleSelector(); 
        this.aiPersonaSelect.innerHTML = '<option value="">-- Select Role First --</option>';
        this.aiPersonaSelect.disabled = true; 
        this.updateSystemMessage(`Destination: ${eraDetails[this.currentEraKey].name}. Now, please choose your role.`);
        this.disableChatFunctionality(); 
      }
      this.updateChatroomInfoDisplays(); 
    }

    private populateRoleSelector(): void { 
        if (!this.roleSelect) return;
        this.roleSelect.innerHTML = '<option value="">-- Choose Your Role --</option>';
        if (!this.currentEraKey || !eraDetails[this.currentEraKey]) {
            this.roleSelect.disabled = true;
            return;
        }
        const era = eraDetails[this.currentEraKey];
        era.userRoles.forEach(role => {
            const option = new Option(`${role.name} (${role.description})`, role.id);
            this.roleSelect.add(option);
        });
        this.roleSelect.disabled = false;
        this.roleSelect.value = ''; 
    }
    
    private async handleRoleChange(): Promise<void> { 
        if (!this.currentEraKey || !eraDetails[this.currentEraKey] || !this.roleSelect || !this.aiPersonaSelect) return;
        this.currentUserRoleKey = this.roleSelect.value;
        
        this.currentAIPersonaId = null;
        this.currentMockParticipantId = null;
        this.activeChatContext = null;
        this.chatHistory = [];
        if (this.chatMessagesContainer) this.chatMessagesContainer.innerHTML = '';

        if (!this.currentUserRoleKey) {
            this.updateSystemMessage(`Please choose your role in ${eraDetails[this.currentEraKey].name}.`);
            this.aiPersonaSelect.innerHTML = '<option value="">-- Select Role First --</option>';
            this.aiPersonaSelect.disabled = true;
            this.disableChatFunctionality();
        } else {
            if (this.currentChatMode === 'group') {
                this.activeChatContext = { type: 'group' };
                this.aiPersonaSelect.disabled = true; 
                await this.initializeChatForCurrentSelection();
            } else if (this.currentChatMode === 'learn' || this.currentChatMode === 'dm') {
                this.populateParticipantOrAIPersonaSelector(); 
                this.updateSystemMessage(`Role: ${eraDetails[this.currentEraKey].userRoles.find(r => r.id === this.currentUserRoleKey)?.name}. Now, select who to chat with.`);
                this.disableChatFunctionality(); 
            }
        }
        this.updateChatroomInfoDisplays(); 
    }

    private populateParticipantOrAIPersonaSelector(): void {
        if (!this.aiPersonaSelect) return;
        this.aiPersonaSelect.innerHTML = `<option value="">-- Select Character/Guide --</option>`;
        if (!this.currentEraKey || !this.currentUserRoleKey || !this.currentChatMode || !eraDetails[this.currentEraKey] || 
            (this.currentChatMode !== 'learn' && this.currentChatMode !== 'dm')) {
            this.aiPersonaSelect.disabled = true;
            return;
        }

        const era = eraDetails[this.currentEraKey];
        
        const generalGuideOption = new Option(`${era.name} Guide (AI)`, GENERAL_ERA_AI_ID);
        generalGuideOption.dataset.type = 'ai';
        this.aiPersonaSelect.add(generalGuideOption);

        if (this.currentChatMode === 'learn' || this.currentChatMode === 'dm') {
            era.aiPersonas?.forEach(persona => {
                const option = new Option(`${persona.name} (AI Persona)`, persona.id);
                option.dataset.type = 'ai';
                this.aiPersonaSelect.add(option);
            });
        }
        
        if (this.currentChatMode === 'dm') {
             era.mockEraParticipants?.forEach(mockP => {
                const role = era.userRoles.find(r => r.id === mockP.roleId);
                const option = new Option(`${mockP.name} (as ${role ? role.name : '...'})`, mockP.id);
                option.dataset.type = 'mock';
                this.aiPersonaSelect.add(option);
            });
        }
        this.aiPersonaSelect.disabled = false;
        this.aiPersonaSelect.value = ''; 
    }
    
    private async handleParticipantOrAIPersonaChange(): Promise<void> {
        if (!this.aiPersonaSelect || !this.currentEraKey || !this.currentUserRoleKey || !this.currentChatMode || 
            (this.currentChatMode !== 'learn' && this.currentChatMode !== 'dm')) {
            return;
        }

        const selectedOption = this.aiPersonaSelect.options[this.aiPersonaSelect.selectedIndex];
        const selectedValue = selectedOption.value;
        
        this.chatHistory = []; 
        if (this.chatMessagesContainer) this.chatMessagesContainer.innerHTML = ''; 

        if (!selectedValue) {
            this.updateSystemMessage("Please select a character or guide to chat with.");
            this.activeChatContext = null;
            this.disableChatFunctionality();
            return;
        }
        
        const type = selectedOption.dataset.type;

        if (type === 'ai') {
            this.currentAIPersonaId = selectedValue;
            this.currentMockParticipantId = null;
            const selectedAIPersona = eraDetails[this.currentEraKey]?.aiPersonas?.find(p => p.id === this.currentAIPersonaId) || 
                                     (this.currentAIPersonaId === GENERAL_ERA_AI_ID ? { name: `${eraDetails[this.currentEraKey].name} Guide` } : null);
            this.activeChatContext = {
                type: 'dm-ai',
                participantId: this.currentAIPersonaId,
                participantName: selectedAIPersona?.name
            };
        } else if (type === 'mock') {
            this.currentMockParticipantId = selectedValue;
            this.currentAIPersonaId = null;
            const mockParticipant = eraDetails[this.currentEraKey]?.mockEraParticipants?.find(p => p.id === this.currentMockParticipantId);
            const mockRole = eraDetails[this.currentEraKey]?.userRoles.find(r => r.id === mockParticipant?.roleId);
            this.activeChatContext = {
                type: 'dm-mock',
                participantId: this.currentMockParticipantId,
                participantName: mockParticipant?.name,
                participantRole: mockRole?.name
            };
        }
        await this.initializeChatForCurrentSelection();
    }

    private populateParticipantsListDisplay(): void {
        if (!this.participantsList) return;
        this.participantsList.innerHTML = '';
        if (!this.currentEraKey || !this.currentUserRoleKey || !eraDetails[this.currentEraKey]) {
            this.participantsList.innerHTML = '<p class="system-message">Configure your session to see participants.</p>';
            return;
        }

        const era = eraDetails[this.currentEraKey];
        const ul = document.createElement('ul');

        const userRole = era.userRoles.find(r => r.id === this.currentUserRoleKey);
        const userLi = document.createElement('li');
        userLi.textContent = `You (as ${userRole ? userRole.name : '...'})`;
        userLi.classList.add('participant-user');
        ul.appendChild(userLi);

        const generalGuideLi = document.createElement('li');
        generalGuideLi.textContent = `${era.name} Guide (AI)`;
        generalGuideLi.classList.add('participant-ai');
        generalGuideLi.dataset.participantId = GENERAL_ERA_AI_ID;
        generalGuideLi.dataset.participantType = 'dm-ai'; 
        generalGuideLi.dataset.participantName = `${era.name} Guide`;
        ul.appendChild(generalGuideLi);

        era.aiPersonas?.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.name} (AI)`;
            li.classList.add('participant-ai');
            li.dataset.participantId = p.id;
            li.dataset.participantType = 'dm-ai';
            li.dataset.participantName = p.name;
            ul.appendChild(li);
        });

        era.mockEraParticipants?.forEach(mockP => {
            const role = era.userRoles.find(r => r.id === mockP.roleId);
            const li = document.createElement('li');
            li.textContent = `${mockP.name} (as ${role ? role.name : 'Unknown Role'})`;
            li.classList.add('participant-mock');
            li.dataset.participantId = mockP.id;
            li.dataset.participantType = 'dm-mock';
            li.dataset.participantName = mockP.name;
            li.dataset.participantRole = role ? role.name : 'Unknown Role';
            ul.appendChild(li);
        });
        this.participantsList.appendChild(ul);
    }

    private async handleParticipantClickFromList(event: MouseEvent): Promise<void> {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'LI' || !target.dataset.participantId || !target.dataset.participantType || target.classList.contains('participant-user')) {
            return;
        }
        
        if (!this.currentEraKey || !this.currentUserRoleKey) {
            this.updateSystemMessage("Please select an era and your role first before direct messaging.");
            return;
        }
        
        const type = target.dataset.participantType as 'dm-ai' | 'dm-mock';
        const id = target.dataset.participantId;
        const name = target.dataset.participantName || 'Unknown Participant';
        const roleName = target.dataset.participantRole;

        if (this.chatMessagesContainer) this.chatMessagesContainer.innerHTML = ''; 
        this.chatHistory = [];

        if (type === 'dm-ai') {
            this.currentAIPersonaId = id;
            this.currentMockParticipantId = null;
            this.activeChatContext = { type: 'dm-ai', participantId: id, participantName: name };
            if (this.aiPersonaSelect && (this.currentChatMode === 'learn' || this.currentChatMode === 'dm')) {
                 this.aiPersonaSelect.value = id; 
            }
        } else { 
            this.currentMockParticipantId = id;
            this.currentAIPersonaId = null;
            this.activeChatContext = { type: 'dm-mock', participantId: id, participantName: name, participantRole: roleName };
             if (this.aiPersonaSelect && this.currentChatMode === 'dm') {
                this.aiPersonaSelect.value = id; 
            }
        }
        
        await this.initializeChatForCurrentSelection();
    }


    private async initializeChatForCurrentSelection(): Promise<void> {
      this.chatHistory = []; 
      
      if (this.chatMessagesContainer && (this.chatMessagesContainer.innerHTML.includes('interactive-status') || this.chatMessagesContainer.children.length > 1) ) {
           const systemStatus = this.chatMessagesContainer.querySelector('.system-message.interactive-status');
           this.chatMessagesContainer.innerHTML = '';
           if (systemStatus) this.chatMessagesContainer.appendChild(systemStatus); 
      }


      if (!this.currentEraKey || !this.currentUserRoleKey || !this.activeChatContext || !eraDetails[this.currentEraKey]) {
          this.updateSystemMessage("Please complete all selections (Era, Role, and specific Chat Target if applicable) to start chatting.");
          this.disableChatFunctionality();
          return;
      }

      const era = eraDetails[this.currentEraKey];
      const userRole = era.userRoles.find(r => r.id === this.currentUserRoleKey);
      if (!userRole) { 
          this.displayFatalError("Selected user role not found."); 
          return;
      }

      this.setChatLoading(true);

      try {
        let systemInstruction = "";
        let welcomeMessageFromAI = ""; 
        let aiDisplayName = "";


        switch (this.activeChatContext.type) {
            case 'group':
                systemInstruction = `You are the Era Guide AI in a group chat for ${era.name}. Users are playing different roles. The current user is a ${userRole.name}. Facilitate conversation, provide historical context, and respond to general queries about the era. Your context is: "${era.initialPromptContext}". If a user @mentions you or asks a direct question, prioritize responding to them.`;
                aiDisplayName = `${era.name} Guide`;
                await this.addMessageToDisplay(`You have joined the ${era.name} group chat as a ${userRole.name}. The Era Guide AI is present. Other participants may join or speak.`, 'system', false);
                break;

            case 'dm-ai':
                const aiPersonaId = this.activeChatContext.participantId;
                let aiPersona;
                if (aiPersonaId === GENERAL_ERA_AI_ID) {
                    aiPersona = { 
                        id: GENERAL_ERA_AI_ID,
                        name: `${era.name} Guide`,
                        systemInstructionPrompt: `You are an AI guide for ChronoChat, specifically for ${era.name}. The user, playing the role of a ${userRole.name}, is chatting directly with you. Your base context is: "${era.initialPromptContext}". Engage them based on their role and queries. Maintain the illusion of the time period.`,
                        welcomeMessage: `Hello, ${userRole.name}. I am the ${era.name} Guide. How can I assist you in your explorations today?`
                    };
                } else {
                    aiPersona = era.aiPersonas?.find(p => p.id === aiPersonaId);
                }

                if (aiPersona) {
                    systemInstruction = aiPersona.systemInstructionPrompt + ` The user you are talking to is playing the role of a ${userRole.name}. Tailor your responses accordingly.`;
                    welcomeMessageFromAI = aiPersona.welcomeMessage;
                    aiDisplayName = aiPersona.name;
                    await this.addMessageToDisplay(`You are now in a private chat with ${aiPersona.name} (AI).`, 'system', false);
                    await this.addMessageToDisplay(welcomeMessageFromAI, 'ai', true, aiDisplayName);
                    this.chatHistory.push({ role: 'model', parts: [{text: welcomeMessageFromAI}] });
                } else {
                    throw new Error(`AI Persona with ID ${aiPersonaId} not found.`);
                }
                break;
            
            case 'dm-mock':
                const mockParticipant = era.mockEraParticipants?.find(mp => mp.id === this.activeChatContext?.participantId);
                if (!mockParticipant) throw new Error("Mock participant not found for DM.");

                const mockParticipantName = mockParticipant.name;
                const mockParticipantRole = era.userRoles.find(r => r.id === mockParticipant.roleId)?.name || 'denizen of this era';
                aiDisplayName = mockParticipantName;

                systemInstruction = `You are an AI simulating a character for ChronoChat. You are pretending to be ${mockParticipantName}, a ${mockParticipantRole} in ${era.name}. The user you are chatting with is a ${userRole.name}. Respond naturally as your character would, based on the era context: "${era.initialPromptContext}". Do not reveal you are an AI or that this is a simulation.`;
                
                await this.addMessageToDisplay(`You are now in a private chat with ${mockParticipantName} (who is a ${mockParticipantRole}). This is a simulated chat.`, 'system', false);
                
                if (mockParticipant.welcomeMessage) {
                    welcomeMessageFromAI = mockParticipant.welcomeMessage;
                } else {
                    const mockWelcomeResponse: GenerateContentResponse = await this.ai.models.generateContent({
                        model: GEMINI_MODEL_NAME,
                        contents: [{role: 'user', parts: [{text: `Hello! I'm a ${userRole.name}. Please greet me as ${mockParticipantName}, the ${mockParticipantRole}. Keep it brief and in character.`}]}],
                        config: { systemInstruction: systemInstruction }
                    });
                    welcomeMessageFromAI = mockWelcomeResponse.text;
                }
                await this.addMessageToDisplay(welcomeMessageFromAI, 'ai', true, aiDisplayName); 
                this.chatHistory.push({ role: 'model', parts: [{text: welcomeMessageFromAI}] });
                break;
        }
        
        this.enableChatFunctionality();

      } catch (error) {
          console.error('Error initializing chat for selection:', error);
          await this.addMessageToDisplay('Error initializing your time travel. Please try again or select another option.', 'system');
          this.disableChatFunctionality(true); 
      } finally {
          this.setChatLoading(false);
      }
    }

    private async handleSendMessage(event: Event): Promise<void> {
      event.preventDefault();
      if (!this.currentEraKey || !this.currentUserRoleKey || !this.activeChatContext || !eraDetails[this.currentEraKey]) {
          this.updateSystemMessage("Cannot send message. Chat session not fully initialized.");
          return;
      }

      const userInput = this.chatInput?.value.trim();
      if (!userInput) return;
      
      const userRoleName = eraDetails[this.currentEraKey]?.userRoles.find(r => r.id === this.currentUserRoleKey)?.name || 'Time Traveler';
      await this.addMessageToDisplay(userInput, 'user', true, `You (as ${userRoleName})`);
      this.chatHistory.push({ role: 'user', parts: [{text: `(Speaking as ${userRoleName}): ${userInput}`}] });
      if (this.chatInput) this.chatInput.value = '';
      this.setChatLoading(true);

      try {
        const era = eraDetails[this.currentEraKey];
        let systemInstruction = "";
        let aiDisplayName = ""; 

        switch (this.activeChatContext.type) {
            case 'group':
                systemInstruction = `You are the Era Guide AI in a group chat for ${era.name}. Users are playing different roles. The current user is a ${userRoleName}. Your base context is: "${era.initialPromptContext}". Respond to the user's messages and facilitate group conversation. Consider previous messages in history.`;
                aiDisplayName = `${era.name} Guide`;
                break;
            case 'dm-ai':
                const aiPersonaId = this.activeChatContext.participantId;
                 if (aiPersonaId === GENERAL_ERA_AI_ID) {
                    systemInstruction = `You are an AI guide for ChronoChat, specifically for ${era.name}. The user, playing the role of a ${userRoleName}, is chatting directly with you. Your base context is: "${era.initialPromptContext}". Engage them based on their role and queries. Maintain the illusion of the time period. Consider previous messages in history.`;
                    aiDisplayName = `${era.name} Guide`;
                } else {
                    const persona = era.aiPersonas?.find(p => p.id === aiPersonaId);
                    if (!persona) throw new Error("AI Persona not found for DM.");
                    systemInstruction = persona.systemInstructionPrompt + ` The user you are talking to is playing the role of a ${userRoleName}. Tailor your responses accordingly. Consider previous messages in history.`;
                    aiDisplayName = persona.name;
                }
                break;
            case 'dm-mock':
                const mockName = this.activeChatContext.participantName || 'Participant';
                const mockRole = this.activeChatContext.participantRole || 'denizen';
                systemInstruction = `You are an AI simulating a character for ChronoChat. You are pretending to be ${mockName}, a ${mockRole} in ${era.name}. The user you are chatting with is a ${userRoleName}. Your context is: "${era.initialPromptContext}". Respond naturally as your character would. Do not reveal you are an AI or that this is a simulation. Consider previous messages in history.`;
                aiDisplayName = mockName;
                break;
            default:
                throw new Error("Invalid chat context type.");
        }
        
        const recentHistory = this.chatHistory.slice(-10); 

        const response: GenerateContentResponse = await this.ai.models.generateContent({
          model: GEMINI_MODEL_NAME,
          contents: recentHistory, 
          config: { systemInstruction: systemInstruction }
        });

        const aiResponseText = response.text;
        await this.addMessageToDisplay(aiResponseText, 'ai', true, aiDisplayName);
        this.chatHistory.push({ role: 'model', parts: [{text: aiResponseText}] });

      } catch (error) {
        console.error('Error getting AI response:', error);
        await this.addMessageToDisplay('An anomaly in the timeline has occurred. Please try sending your message again.', 'system');
      } finally {
        this.setChatLoading(false);
        if (this.chatInput) this.chatInput.focus();
      }
    }

    private async addMessageToDisplay(text: string, sender: 'user' | 'ai' | 'system', useMarked = true, displayNameOverride?: string): Promise<void> {
      if (!this.chatMessagesContainer) return;
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', `${sender}-message`);
      
      let htmlContent = text; 

      const nameElement = document.createElement('strong');
      if (sender === 'user') {
          nameElement.textContent = displayNameOverride || 'You:';
      } else if (sender === 'ai') {
          nameElement.textContent = `${displayNameOverride || 'AI'}:`;
      }
      if (sender === 'system' && displayNameOverride) {
          nameElement.textContent = `${displayNameOverride}:`;
      }


      if (sender === 'user' || sender === 'ai' || (sender === 'system' && displayNameOverride) ) {
           messageElement.appendChild(nameElement);
      }
      
      const contentElement = document.createElement('div');
      contentElement.classList.add('message-content');
      if (useMarked) {
          const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          let parsedHtml = '';
          try {
            // Attempt to handle potential markdown code blocks specifically for marked
            // Marked expects the pure markdown, not necessarily wrapped in ```json ... ``` if it's just a JSON string
            // If the string IS ```json ... ``` then marked can parse the inner part.
            // For now, let's assume standard markdown parsing. If Gemini adds fences, they should be handled by marked.
             parsedHtml = await marked.parse(sanitizedText);
          } catch (e) {
            console.warn("Marked parsing failed, using text content:", e);
            parsedHtml = sanitizedText; 
          }
          contentElement.innerHTML = parsedHtml;
      } else {
          contentElement.textContent = text;
      }
      messageElement.appendChild(contentElement);
      
      if (sender === 'system' && !displayNameOverride) {
          messageElement.innerHTML = contentElement.innerHTML; 
          messageElement.classList.add('no-name');
      }

      this.chatMessagesContainer.appendChild(messageElement);
      this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
    }

    private setChatLoading(isLoading: boolean): void {
      if (this.chatLoadingIndicator) this.chatLoadingIndicator.style.display = isLoading ? 'flex' : 'none';
      
      const disableInputs = isLoading || !this.activeChatContext;
      if (this.chatInput) this.chatInput.disabled = disableInputs;
      if (this.sendButton) this.sendButton.disabled = disableInputs;
      if (this.snapshotButton) this.snapshotButton.disabled = disableInputs;
    }

     private setSnapshotLoading(isLoading: boolean): void {
      if (this.snapshotLoadingIndicator) this.snapshotLoadingIndicator.style.display = isLoading ? 'inline-flex' : 'none';
      if (this.snapshotButton) this.snapshotButton.disabled = isLoading || !this.activeChatContext;
    }

    private async handleTakeSnapshot(): Promise<void> {
      if (!this.currentEraKey || !this.currentUserRoleKey || !this.activeChatContext || !eraDetails[this.currentEraKey]) {
          await this.addMessageToDisplay('Please ensure your chat session is fully active before taking a snapshot.', 'system');
          return;
      }
      this.setSnapshotLoading(true);
      const era = eraDetails[this.currentEraKey];
      const userRole = era.userRoles.find(r => r.id === this.currentUserRoleKey);
      
      let interactionTargetName = ''; 
      if (this.activeChatContext.type === 'dm-ai' && this.activeChatContext.participantName) {
          interactionTargetName = this.activeChatContext.participantName;
      } else if (this.activeChatContext.type === 'dm-mock' && this.activeChatContext.participantName) {
          interactionTargetName = `${this.activeChatContext.participantName} (as ${this.activeChatContext.participantRole})`;
      } else if (this.activeChatContext.type === 'group') {
          interactionTargetName = `the ${era.name} Guide and other participants`;
      }

      let prompt = `A time traveler, playing the role of a ${userRole?.name || 'visitor'}, exploring ${era.imagePromptSubject || era.description}. `;
      if (interactionTargetName) {
          prompt = `A time traveler (as a ${userRole?.name || 'visitor'}) interacting with ${interactionTargetName} amidst ${era.imagePromptSubject || era.description}. `;
      }
      prompt += "The scene should be evocative of the era. Style: vibrant digital painting, atmospheric, detailed."

      try {
          const response = await this.ai.models.generateImages({
              model: IMAGEN_MODEL_NAME,
              prompt: prompt,
              config: { numberOfImages: 1, outputMimeType: 'image/jpeg'},
          });

          if (response.generatedImages && response.generatedImages.length > 0) {
              const base64ImageBytes = response.generatedImages[0].image.imageBytes;
              if (this.snapshotImage) this.snapshotImage.src = `data:image/jpeg;base64,${base64ImageBytes}`;
              if (this.snapshotModalTitle) this.snapshotModalTitle.textContent = `Snapshot from ${era.name}!`;
              this.showSnapshotModal();
          } else {
              throw new Error('No image generated or API response malformed.');
          }

      } catch (error) {
          console.error('Error generating snapshot:', error);
          await this.addMessageToDisplay('Could not generate snapshot. The timeline is unstable here. Try again later.', 'system');
      } finally {
          this.setSnapshotLoading(false);
      }
    }

    private showSnapshotModal(): void {
      if (!this.snapshotModal || !this.snapshotModalCloseButton) return;
      this.snapshotModal.style.display = 'flex'; 
      this.snapshotModal.setAttribute('aria-hidden', 'false');
      this.snapshotModalCloseButton.focus(); 
    }

    private hideSnapshotModal(): void {
      if (!this.snapshotModal) return;
      this.snapshotModal.style.display = 'none';
      this.snapshotModal.setAttribute('aria-hidden', 'true');
      if(this.snapshotButton) this.snapshotButton.focus(); 
    }

    private async handleShareSnapshot(): Promise<void> {
      const eraName = (this.currentEraKey && eraDetails[this.currentEraKey]) ? eraDetails[this.currentEraKey].name : 'an unknown era';
      const userRoleName = (this.currentEraKey && this.currentUserRoleKey && eraDetails[this.currentEraKey] && eraDetails[this.currentEraKey].userRoles.find(r=>r.id === this.currentUserRoleKey)?.name) || 'a time traveler';
      
      let interactionContext = `as a ${userRoleName}`;
      if (this.activeChatContext && this.activeChatContext.type !== 'group' && this.activeChatContext.participantName) {
        interactionContext += ` with ${this.activeChatContext.participantName}`;
      } else if (this.activeChatContext && this.activeChatContext.type === 'group') {
        interactionContext += ` in the ${eraName} group chat`;
      }

      const textToCopy = `I just took a virtual snapshot in ${eraName} ${interactionContext} on ChronoChat! #ChronoChat #${this.currentEraKey || 'TimeTravel'}`;
      
      try {
          await navigator.clipboard.writeText(textToCopy);
          await this.addMessageToDisplay('Snapshot info copied to clipboard!', 'system', false);
      } catch (err) {
          console.error('Failed to copy text: ', err);
          await this.addMessageToDisplay('Could not copy info. You can manually share your experience!', 'system', false);
      }
      this.hideSnapshotModal(); 
    }
  } 

  if (isLoggedIn && isMainAppPage) {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ChronoChatApp());
      } else {
        new ChronoChatApp();
      }
    } catch (e: any) {
      console.error("Failed to initialize ChronoChatApp during script execution:", e);
       const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 2em; font-size: 1.2em;">Critical error initializing ChronoChat: ${e.message || 'Unknown error'}. Please check console.</p>`;
        } else {
            document.body.innerHTML = `<p style="font-family: 'Roboto', sans-serif; color: #E0E0E0; background-color: #0D0E1A; text-align: center; padding: 3em; font-size: 1.2em; min-height: 100vh; margin:0; display:flex; align-items:center; justify-content:center;">Critical error initializing ChronoChat: ${e.message || 'Unknown error'}. Main container not found.</p>`;
        }
    }
  } else if (!isMainAppPage && isLoggedIn) {
      console.log("ChronoChat script (index.tsx) loaded on a non-main page while logged in. App not initialized on this page. Current path:", currentPath);
  } else if (!isMainAppPage && !isLoggedIn) {
       console.log("ChronoChat script (index.tsx) loaded on a non-main page while not logged in. App not initialized on this page. Current path:", currentPath);
  }

})();
