class FocusTimer {
    constructor() {
        this.currentTime = 25 * 60; // 25 minutes in seconds
        this.isRunning = false;
        this.currentMode = 'focus';
        this.sessionCount = 1;
        this.maxSessions = 4;
        this.timerInterval = null;
        this.soundEnabled = true;
        this.desktopNotifications = true;
        
        // Timer durations (in minutes)
        this.durations = {
            focus: 25,
            shortBreak: 5,
            longBreak: 15
        };
        
        // Current theme
        this.currentTheme = 'ocean';
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.updateDisplay();
        this.updateWeather();
        
        // Initialize PWA features
        this.initializePWA();
    }
    
    initializeElements() {
        // Timer elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerMode = document.getElementById('timerMode');
        this.timerSession = document.getElementById('timerSession');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        
        // Mode selector
        this.modeBtns = document.querySelectorAll('.mode-btn');
        
        // Settings
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettings = document.getElementById('closeSettings');
        
        // Theme controls
        this.themeToggle = document.getElementById('themeToggle');
        this.themeSelector = document.getElementById('themeSelector');
        this.closeThemeBtn = document.getElementById('closeThemeBtn');
        this.themeOptions = document.querySelectorAll('.theme-option, .theme-btn');
        
        // Settings inputs
        this.focusDurationInput = document.getElementById('focusDuration');
        this.shortBreakDurationInput = document.getElementById('shortBreakDuration');
        this.longBreakDurationInput = document.getElementById('longBreakDuration');
        this.soundEnabledInput = document.getElementById('soundEnabled');
        this.desktopNotificationsInput = document.getElementById('desktopNotifications');
        
        // Weather
        this.weatherDisplay = document.getElementById('weatherDisplay');
        
        // Progress ring
        this.progressRing = document.querySelector('.progress-ring-circle');
        this.circumference = 2 * Math.PI * 140; // radius = 140
        this.progressRing.style.strokeDasharray = this.circumference;
        this.progressRing.style.strokeDashoffset = this.circumference;
    }
    
    bindEvents() {
        // Timer controls
        this.playPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.skipBtn.addEventListener('click', () => this.skipTimer());
        
        // Mode selector
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
        });
        
        // Settings
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettings.addEventListener('click', () => this.closeSettingsPanel());
        
        // Theme controls
        this.themeToggle.addEventListener('click', () => this.openThemeSelector());
        this.closeThemeBtn.addEventListener('click', () => this.closeThemeSelector());
        this.themeOptions.forEach(option => {
            option.addEventListener('click', () => this.setTheme(option.dataset.theme));
        });
        
        // Settings inputs
        this.focusDurationInput.addEventListener('change', () => this.updateDurations());
        this.shortBreakDurationInput.addEventListener('change', () => this.updateDurations());
        this.longBreakDurationInput.addEventListener('change', () => this.updateDurations());
        this.soundEnabledInput.addEventListener('change', () => this.updateSettings());
        this.desktopNotificationsInput.addEventListener('change', () => this.updateSettings());
        
        // Close theme selector when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.themeSelector.contains(e.target) && !this.themeToggle.contains(e.target)) {
                this.closeThemeSelector();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetTimer();
            } else if (e.code === 'KeyS') {
                e.preventDefault();
                this.skipTimer();
            }
        });
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        this.playPauseBtn.classList.add('pulse');
        
        this.timerInterval = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            this.updateProgress();
            
            if (this.currentTime <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.playPauseBtn.classList.remove('pulse');
        clearInterval(this.timerInterval);
    }
    
    resetTimer() {
        this.pauseTimer();
        
        // Convert mode names to match durations object
        const modeMap = {
            'focus': 'focus',
            'short-break': 'shortBreak',
            'long-break': 'longBreak'
        };
        
        const durationKey = modeMap[this.currentMode] || this.currentMode;
        this.currentTime = this.durations[durationKey] * 60;
        this.updateDisplay();
        this.updateProgress();
    }
    
    skipTimer() {
        this.completeTimer();
    }
    
    completeTimer() {
        this.pauseTimer();
        
        // Play notification sound
        if (this.soundEnabled) {
            this.playNotificationSound();
        }
        
        // Show desktop notification
        if (this.desktopNotifications && Notification.permission === 'granted') {
            this.showNotification();
        }
        
        // Move to next mode
        this.nextMode();
    }
    
    nextMode() {
        if (this.currentMode === 'focus') {
            this.sessionCount++;
            if (this.sessionCount <= this.maxSessions) {
                this.setMode('short-break');
            } else {
                this.setMode('long-break');
                this.sessionCount = 0; // Reset for next cycle
            }
        } else {
            this.setMode('focus');
        }
    }
    
    setMode(mode) {
        this.currentMode = mode;
        
        // Convert mode names to match durations object
        const modeMap = {
            'focus': 'focus',
            'short-break': 'shortBreak',
            'long-break': 'longBreak'
        };
        
        const durationKey = modeMap[mode] || mode;
        this.currentTime = this.durations[durationKey] * 60;
        
        // Update mode buttons
        this.modeBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // Update mode display
        const modeNames = {
            'focus': 'Focus',
            'short-break': 'Short Break',
            'long-break': 'Long Break'
        };
        
        this.timerMode.textContent = modeNames[mode];
        this.updateDisplay();
        this.updateProgress();
        this.resetTimer();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update session display
        if (this.currentMode === 'focus') {
            this.timerSession.textContent = `Session ${this.sessionCount} of ${this.maxSessions}`;
        } else {
            this.timerSession.textContent = this.currentMode === 'short-break' ? 'Short Break' : 'Long Break';
        }
    }
    
    updateProgress() {
        // Convert mode names to match durations object
        const modeMap = {
            'focus': 'focus',
            'short-break': 'shortBreak',
            'long-break': 'longBreak'
        };
        
        const durationKey = modeMap[this.currentMode] || this.currentMode;
        const totalTime = this.durations[durationKey] * 60;
        const progress = (totalTime - this.currentTime) / totalTime;
        const offset = this.circumference - (progress * this.circumference);
        this.progressRing.style.strokeDashoffset = offset;
    }
    
    openSettings() {
        this.settingsPanel.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    
    closeSettingsPanel() {
        this.settingsPanel.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
    
    openThemeSelector() {
        this.themeSelector.classList.add('open');
        document.body.insertAdjacentHTML('beforeend', '<div class="overlay show"></div>');
    }
    
    closeThemeSelector() {
        this.themeSelector.classList.remove('open');
        const overlay = document.querySelector('.overlay');
        if (overlay) overlay.remove();
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        
        // Update theme options
        this.themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === theme) {
                option.classList.add('active');
            }
        });
        
        this.closeThemeSelector();
        this.saveSettings();
    }
    
    updateDurations() {
        this.durations.focus = parseInt(this.focusDurationInput.value);
        this.durations.shortBreak = parseInt(this.shortBreakDurationInput.value);
        this.durations.longBreak = parseInt(this.longBreakDurationInput.value);
        
        // Update current time if not running
        if (!this.isRunning) {
            // Convert mode names to match durations object
            const modeMap = {
                'focus': 'focus',
                'short-break': 'shortBreak',
                'long-break': 'longBreak'
            };
            
            const durationKey = modeMap[this.currentMode] || this.currentMode;
            this.currentTime = this.durations[durationKey] * 60;
            this.updateDisplay();
            this.updateProgress();
        }
        
        this.saveSettings();
    }
    
    updateSettings() {
        this.soundEnabled = this.soundEnabledInput.checked;
        this.desktopNotifications = this.desktopNotificationsInput.checked;
        this.saveSettings();
    }
    
    async updateWeather() {
        try {
            // Use wttr.in - completely free weather API, no key needed
            const response = await fetch('https://wttr.in/?format=j1');
            
            if (!response.ok) {
                throw new Error('Weather API failed');
            }
            
            const data = await response.json();
            
            if (data.current_condition && data.nearest_area) {
                const temp = data.current_condition[0].temp_C;
                const condition = data.current_condition[0].weatherDesc[0].value;
                const icon = this.getWeatherIcon(condition);
                const location = data.nearest_area[0].areaName[0].value;
                
                this.weatherDisplay.innerHTML = `
                    <div class="weather-info">
                        <i class="fas ${icon} weather-icon"></i>
                        <span class="weather-temp">${temp}°C</span>
                        <span class="weather-location">${location}</span>
                    </div>
                `;
            }
        } catch (error) {
            console.log('Weather API failed, using mock data');
            this.showMockWeather();
        }
    }
    
    
    showMockWeather() {
        // Mock weather data - you can replace this with a real API call
        const mockWeather = {
            temp: 22,
            icon: 'fa-cloud-sun',
            location: 'New York'
        };
        
        this.weatherDisplay.innerHTML = `
            <div class="weather-info">
                <i class="fas ${mockWeather.icon} weather-icon"></i>
                <span class="weather-temp">${mockWeather.temp}°C</span>
                <span class="weather-location">${mockWeather.location}</span>
            </div>
        `;
    }
    
    getWeatherIcon(weather) {
        const weatherLower = weather.toLowerCase();
        const icons = {
            'clear': 'fa-sun',
            'sunny': 'fa-sun',
            'clouds': 'fa-cloud',
            'cloudy': 'fa-cloud',
            'overcast': 'fa-cloud',
            'rain': 'fa-cloud-rain',
            'rainy': 'fa-cloud-rain',
            'snow': 'fa-snowflake',
            'snowy': 'fa-snowflake',
            'thunderstorm': 'fa-bolt',
            'storm': 'fa-bolt',
            'drizzle': 'fa-cloud-drizzle',
            'mist': 'fa-smog',
            'fog': 'fa-smog',
            'foggy': 'fa-smog',
            'haze': 'fa-smog',
            'partly cloudy': 'fa-cloud-sun',
            'partly sunny': 'fa-cloud-sun',
            'mostly cloudy': 'fa-cloud',
            'mostly sunny': 'fa-cloud-sun'
        };
        return icons[weatherLower] || 'fa-cloud-sun';
    }
    
    playNotificationSound() {
        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    showNotification() {
        const modeNames = {
            focus: 'Focus session',
            shortBreak: 'Short break',
            longBreak: 'Long break'
        };
        
        new Notification('Timer Complete!', {
            body: `${modeNames[this.currentMode]} is finished. Time for a ${this.currentMode === 'focus' ? 'break' : 'focus session'}!`,
            icon: '/favicon.ico'
        });
    }
    
    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            durations: this.durations,
            soundEnabled: this.soundEnabled,
            desktopNotifications: this.desktopNotifications
        };
        localStorage.setItem('focusTimerSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('focusTimerSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.currentTheme = settings.theme || 'ocean';
            this.durations = { ...this.durations, ...settings.durations };
            this.soundEnabled = settings.soundEnabled !== false;
            this.desktopNotifications = settings.desktopNotifications !== false;
            
            // Apply settings
            document.body.setAttribute('data-theme', this.currentTheme);
            this.focusDurationInput.value = this.durations.focus;
            this.shortBreakDurationInput.value = this.durations.shortBreak;
            this.longBreakDurationInput.value = this.durations.longBreak;
            this.soundEnabledInput.checked = this.soundEnabled;
            this.desktopNotificationsInput.checked = this.desktopNotifications;
        }
    }
    
    // PWA Initialization
    initializePWA() {
        this.setupInstallPrompt();
        this.setupOfflineStorage();
        this.addMobileOptimizations();
    }
    
    // Setup Install Prompt
    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt triggered');
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallButton(deferredPrompt);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
        });
    }
    
    // Show Install Button
    showInstallButton(deferredPrompt) {
        // Create install button
        const installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
        installBtn.className = 'install-btn';
        
        // Add to header
        const header = document.querySelector('.header');
        header.appendChild(installBtn);
        
        // Add click handler
        installBtn.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                this.hideInstallButton();
            });
        });
    }
    
    // Hide Install Button
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.remove();
        }
    }
    
    // Setup Offline Storage
    setupOfflineStorage() {
        // Initialize IndexedDB for offline data storage
        this.initIndexedDB();
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
    }
    
    // Initialize IndexedDB
    initIndexedDB() {
        const request = indexedDB.open('FocusTimerDB', 1);
        
        request.onerror = () => {
            console.error('IndexedDB failed to open');
        };
        
        request.onsuccess = () => {
            this.db = request.result;
            console.log('IndexedDB opened successfully');
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create timer sessions store
            if (!db.objectStoreNames.contains('timerSessions')) {
                const timerStore = db.createObjectStore('timerSessions', { keyPath: 'id', autoIncrement: true });
                timerStore.createIndex('timestamp', 'timestamp', { unique: false });
                timerStore.createIndex('mode', 'mode', { unique: false });
            }
            
            // Create settings store
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
            }
        };
    }
    
    // Handle Online Event
    handleOnline() {
        console.log('App is online');
        this.showOnlineStatus();
    }
    
    // Handle Offline Event
    handleOffline() {
        console.log('App is offline');
        this.showOfflineStatus();
    }
    
    // Show Online Status
    showOnlineStatus() {
        this.showStatusMessage('Back online', 'success');
    }
    
    // Show Offline Status
    showOfflineStatus() {
        this.showStatusMessage('Working offline', 'warning');
    }
    
    // Show Status Message
    showStatusMessage(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 3000);
    }
    
    // Add Mobile Optimizations
    addMobileOptimizations() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Add touch feedback for buttons
        this.addTouchFeedback();
        
        // Optimize for mobile viewport
        this.optimizeMobileViewport();
    }
    
    // Add Touch Feedback
    addTouchFeedback() {
        const buttons = document.querySelectorAll('button, .mode-btn, .theme-btn, .theme-option');
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', () => {
                button.style.transform = 'scale(1)';
            });
        });
    }
    
    // Optimize Mobile Viewport
    optimizeMobileViewport() {
        // Set viewport height for mobile browsers
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Initialize the timer
    new FocusTimer();
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js?v=1.0.2')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

