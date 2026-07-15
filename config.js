/* Copyright (c) 2026 Saud Alhamad. All rights reserved. Licensed to STTF. */

/**
 * ╔══════════════════════════════════════════════════════╗
 * ║          ملف إعدادات النسخة — config.js             ║
 * ║  هذا هو الملف الوحيد الذي يتغيّر بين كل عميل       ║
 * ╚══════════════════════════════════════════════════════╝
 */

const APP_CONFIG = {

    // ── هوية الاتحاد ──────────────────────────────────────────
    federationName:   "الاتحاد السعودي لكرة الطاولة",
    federationNameEn: "Saudi Table Tennis Federation",

    // رابط شعار الاتحاد
    logoURL: "logo1.png",

    // ── ألوان الاتحاد السعودي لكرة الطاولة ───────────────────
    primaryColor:  "#1E9847",   // الأخضر الرئيسي STTF
    primaryHover:  "#178a3a",   // أخضر أغمق للـ hover
    accentColor:   "#f39c12",   // برتقالي للحالات التنبيهية (timeout، تحذيرات)
    brandNavy:     "#162B32",   // الكحلي الداكن من شعار الاتحاد
    bgDark:        "#060d09",   // خلفية داكنة مع مسحة خضراء

    // ── روابط التواصل الاجتماعي ──────────────────────────────
    socialLinks: {
        twitter:   "https://twitter.com/sttf_ksa",
        instagram: "https://instagram.com/sttf_ksa",
        youtube:   "https://www.youtube.com/@sauditabletennis",
        website:   "https://sttf.sa"
    },

    // ── إعدادات Firebase ──────────────────────────────────────
    firebase: {
        apiKey:            "AIzaSyAQ74IHM5BN9nAoviMcCaMFnipNfNAGCLM",
        authDomain:        "tennis-score-6f110.firebaseapp.com",
        databaseURL:       "https://tennis-score-6f110-default-rtdb.firebaseio.com/",
        projectId:         "tennis-score-6f110",
        storageBucket:     "tennis-score-6f110.firebasestorage.app",
        messagingSenderId: "658383996",
        appId:             "1:658383996:web:b4ccdd8add0e75ce8e15f9",
        measurementId:     "G-27CZ3QYC4D"
    }
};

/**
 * تُطبَّق هذه الدالة تلقائياً — تضخّ الألوان كـ CSS Variables
 */
function applyConfig() {
    const r = document.documentElement;

    r.style.setProperty('--primary-color',  APP_CONFIG.primaryColor);
    r.style.setProperty('--primary-gold',   APP_CONFIG.primaryColor);
    r.style.setProperty('--primary-hover',  APP_CONFIG.primaryHover);
    r.style.setProperty('--accent-color',   APP_CONFIG.accentColor);
    r.style.setProperty('--ittf-orange',    APP_CONFIG.accentColor);
    r.style.setProperty('--timeout-color',  APP_CONFIG.accentColor);
    r.style.setProperty('--brand-navy',     APP_CONFIG.brandNavy);
    r.style.setProperty('--ittf-green',     APP_CONFIG.brandNavy);
    r.style.setProperty('--brand-green',    APP_CONFIG.brandNavy);
    r.style.setProperty('--bg-dark',        APP_CONFIG.bgDark);

    // تحديث عنوان التبويب
    if (APP_CONFIG.federationName) {
        document.title = APP_CONFIG.federationName + ' · ' + document.title;
    }

    // شعار الاتحاد في أي عنصر يحمل كلاس federation-logo
    document.querySelectorAll('.federation-logo').forEach(function(el) {
        if (APP_CONFIG.logoURL) {
            el.src = APP_CONFIG.logoURL;
            el.style.display = 'inline-block';
        }
    });

    // اسم الاتحاد في أي عنصر يحمل كلاس federation-name
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