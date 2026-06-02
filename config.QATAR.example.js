/* Copyright (c) 2026 Saud Alhamad. All rights reserved. Licensed to STTF. */

/**
 * مثال: نسخة الاتحاد القطري
 * انسخ هذا الملف وأعد تسميته إلى config.js في مجلد النسخة القطرية
 */

const APP_CONFIG = {

    federationName:   "الاتحاد القطري لكرة الطاولة",
    federationNameEn: "Qatar Table Tennis Association",
    logoURL:          "https://example.com/qatar-logo.png",

    primaryColor: "#8B0000",   // أحمر قطر
    accentColor:  "#ffffff",
    brandGreen:   "#4a0a0a",

    socialLinks: {
        twitter:   "https://twitter.com/QatarTT",
        instagram: "https://instagram.com/QatarTT",
        youtube:   "",
        website:   "https://qata.qa"
    },

    firebase: {
        apiKey:            "PASTE_QATAR_API_KEY_HERE",
        authDomain:        "qatar-tt.firebaseapp.com",
        databaseURL:       "https://qatar-tt-default-rtdb.firebaseio.com/",
        projectId:         "qatar-tt",
        storageBucket:     "qatar-tt.firebasestorage.app",
        messagingSenderId: "000000000",
        appId:             "1:000000000:web:000000000",
        measurementId:     "G-XXXXXXXXXX"
    }
};

function applyConfig() {
    const r = document.documentElement;
    r.style.setProperty('--primary-color',  APP_CONFIG.primaryColor);
    r.style.setProperty('--primary-gold',   APP_CONFIG.primaryColor);
    r.style.setProperty('--primary-hover',  shadeColor(APP_CONFIG.primaryColor, -10));
    r.style.setProperty('--accent-color',   APP_CONFIG.accentColor);
    r.style.setProperty('--ittf-orange',    APP_CONFIG.accentColor);
    r.style.setProperty('--timeout-color',  APP_CONFIG.accentColor);
    r.style.setProperty('--brand-green',    APP_CONFIG.brandGreen);
    r.style.setProperty('--ittf-green',     APP_CONFIG.brandGreen);
    if (APP_CONFIG.federationName) {
        document.title = APP_CONFIG.federationName + ' · ' + document.title;
    }
    document.querySelectorAll('.federation-logo').forEach(function(el) {
        if (APP_CONFIG.logoURL) { el.src = APP_CONFIG.logoURL; el.style.display = 'inline-block'; }
    });
    document.querySelectorAll('.federation-name').forEach(function(el) {
        el.textContent = APP_CONFIG.federationName;
    });
}
function shadeColor(hex, percent) {
    var num = parseInt(hex.replace('#', ''), 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)));
    var b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * percent)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyConfig);
} else {
    applyConfig();
}
