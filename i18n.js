let translations = {};
let currentLang = 'en-US';

const LANG_KEY = 'preferred-language';

const languages = {
    'en-US': 'English',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'ja-JP': '日本語',
    'ko-KR': '한국어',
    'ru-RU': 'Русский',
    'ar-SA': 'العربية',
    'he-IL': 'עברית',
    'vi-VN': 'Tiếng Việt',
    'th-TH': 'ภาษาไทย',
    'de-DE': 'Deutsch',
    'fr-FR': 'Français',
    'es-ES': 'Español',
    'it-IT': 'Italiano'
};

const rtlLanguages = ['ar-SA', 'he-IL'];

const localStorageAvailable = () => {
    try {
        const x = '__storage_test__';
        localStorage.setItem(x, x);
        localStorage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
};

const memoryStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    }
};

const storage = localStorageAvailable() ? localStorage : memoryStorage;

function getStoredLanguage() {
    return storage.getItem(LANG_KEY);
}

function storeLanguage(lang) {
    storage.setItem(LANG_KEY, lang);
}

function getInitialLanguage() {
    const storedLang = getStoredLanguage();
    if (storedLang && languages[storedLang]) {
        return storedLang;
    }
    
    const browserLang = navigator.language || navigator.userLanguage;
    const exactMatch = Object.keys(languages).find(lang => lang === browserLang);
    if (exactMatch) {
        return exactMatch;
    }
    
    const langPrefix = browserLang.split('-')[0];
    const prefixMatch = Object.keys(languages).find(lang => lang.startsWith(langPrefix + '-'));
    if (prefixMatch) {
        return prefixMatch;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && languages[langParam]) {
        return langParam;
    }
    
    return 'en-US';
}

async function loadTranslation(lang) {
    try {
        const response = await fetch(`i18n/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
        return await response.json();
    } catch (error) {
        console.error(`Error loading translation for ${lang}:`, error);
        return null;
    }
}

async function initializeTranslations() {
    for (const lang of Object.keys(languages)) {
        const translation = await loadTranslation(lang);
        if (translation) {
            translations[lang] = translation;
        }
    }
    
    if (Object.keys(translations).length === 0) {
        console.error('No translations loaded');
        return;
    }
    
    const fallbackTranslations = {
        'sidebar': {
            'toggle': 'View Profile Info'
        }
    };
    
    for (const lang of Object.keys(translations)) {
        if (!translations[lang].sidebar) {
            translations[lang].sidebar = {};
        }
        if (!translations[lang].sidebar.toggle) {
            translations[lang].sidebar.toggle = fallbackTranslations.sidebar.toggle;
        }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && languages[langParam]) {
        currentLang = langParam;
        storeLanguage(langParam);
    } else {
        currentLang = getInitialLanguage();
    }
    
    updateLanguage(currentLang);
}

function updateLanguage(lang) {
    if (!translations[lang]) {
        console.error(`Translation not available for ${lang}`);
        return;
    }
    
    currentLang = lang;
    storeLanguage(lang);
    
    const htmlLang = lang.split('-')[0];
    document.documentElement.lang = htmlLang;
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = lang;
    }
    
    if (rtlLanguages.includes(lang)) {
        document.documentElement.dir = 'rtl';
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
    } else {
        document.documentElement.dir = 'ltr';
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
    }
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const keys = element.getAttribute('data-i18n').split('.');
        let value = translations[lang];
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`Translation missing for: ${element.getAttribute('data-i18n')} in ${lang}`);
                return;
            }
        }
        
        if (typeof value === 'string') {
            element.textContent = value;
        } else {
            console.warn(`Translation value is not a string for: ${element.getAttribute('data-i18n')} in ${lang}`);
        }
    });
    
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const sidebarContent = document.getElementById('sidebarContent');
    if (mobileSidebarToggle && sidebarContent) {
        const isHidden = sidebarContent.classList.contains('hidden');
        const toggleText = translations[lang].sidebar && translations[lang].sidebar.toggle 
            ? translations[lang].sidebar.toggle 
            : 'View Profile Info';
        mobileSidebarToggle.innerHTML = `<span data-i18n="sidebar.toggle">${isHidden ? toggleText : toggleText.replace('View', 'Hide')}</span>`;
    }
}

function changeLanguage(lang) {
    updateLanguage(lang);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTranslations();
});