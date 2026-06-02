(function () {
  const CORRECT_PIN = "1234"; // ← غير هذا الرقم للـ PIN اللي تبغاه
  const STORAGE_KEY = "sttf_authorized";

  if (localStorage.getItem(STORAGE_KEY) === "true") return;

  document.documentElement.style.visibility = "hidden";

  const overlay = document.createElement("div");
  overlay.id = "pin-overlay";
  overlay.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');

      #pin-overlay {
        position: fixed;
        inset: 0;
        background-color: #0d1520;
        background-image:
          radial-gradient(ellipse at 50% -5%, rgba(2,140,70,0.12) 0%, transparent 52%),
          repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(2,140,70,0.025) 7px, rgba(2,140,70,0.025) 8px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        font-family: 'Cairo', 'Inter', sans-serif;
        direction: rtl;
      }

      #pin-overlay::before {
        content: '';
        position: fixed;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #028C46, transparent);
        z-index: 100000;
        animation: topBarShimmer 1.5s ease-out 1 forwards;
      }

      @keyframes topBarShimmer {
        0%   { opacity: 0; }
        40%  { opacity: 1; filter: brightness(2.2); }
        100% { opacity: 1; filter: brightness(1); }
      }

      @keyframes cardEntrance {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes h1Pulse {
        0%, 100% { text-shadow: 0 4px 10px rgba(2,79,37,0.4); }
        50%       { text-shadow: 0 4px 22px rgba(2,140,70,0.7); }
      }

      #pin-card {
        background-color: #111d24;
        border: 1px solid rgba(2, 140, 70, 0.25);
        border-radius: 20px;
        padding: 40px 48px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(2,140,70,0.15);
        min-width: 300px;
        max-width: 380px;
        width: 90%;
        animation: cardEntrance 0.45s ease-out forwards;
        transition: border-color 0.3s, box-shadow 0.3s;
      }

      #pin-card:hover {
        border-color: #028C46;
        box-shadow: 0 8px 25px rgba(2, 140, 70, 0.35), inset 0 1px 0 rgba(2,140,70,0.15);
      }

      #pin-logo {
        width: 72px;
        margin-bottom: 20px;
        opacity: 0.92;
      }

      #pin-title {
        color: #028C46;
        font-size: 1.5rem;
        font-weight: 900;
        margin: 0 0 4px 0;
        letter-spacing: 0.5px;
        animation: h1Pulse 4s ease-in-out infinite;
      }

      #pin-subtitle {
        color: rgba(255,255,255,0.4);
        font-size: 0.8rem;
        margin: 0 0 28px 0;
      }

      #pin-input {
        width: 100%;
        padding: 13px 15px;
        font-size: 22px;
        text-align: center;
        letter-spacing: 0.4em;
        background-color: #1a2830;
        color: white;
        border: 2px solid rgba(2,140,70,0.25);
        border-radius: 12px;
        outline: none;
        box-sizing: border-box;
        margin-bottom: 14px;
        font-family: 'Cairo', sans-serif;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      #pin-input:focus {
        border-color: #028C46;
        box-shadow: 0 0 0 3px rgba(2,140,70,0.25);
      }

      #pin-input::placeholder { color: #444; }

      #pin-error {
        color: #ff5555;
        font-size: 0.82rem;
        margin-bottom: 14px;
        min-height: 18px;
        transition: opacity 0.2s;
      }

      #pin-btn {
        width: 100%;
        padding: 12px;
        font-size: 1.1rem;
        background: linear-gradient(135deg, #028C46, #024F25);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 700;
        font-family: 'Cairo', sans-serif;
        box-shadow: 0 4px 15px rgba(2, 140, 70, 0.3);
        transition: filter 0.2s, box-shadow 0.2s, transform 0.1s;
        position: relative;
        overflow: hidden;
      }

      #pin-btn:hover {
        filter: brightness(1.1);
        box-shadow: 0 8px 25px rgba(2, 140, 70, 0.35);
      }

      #pin-btn:active {
        transform: scale(0.96);
      }
    </style>

    <div id="pin-card">
      <h2 id="pin-title">نظام العداد الإلكتروني</h2>
      <p id="pin-subtitle">الاتحاد السعودي لكرة الطاولة</p>
      <input
        id="pin-input"
        type="password"
        inputmode="numeric"
        maxlength="6"
        placeholder="••••"
      />
      <div id="pin-error"></div>
      <button id="pin-btn">دخول</button>
    </div>
  `;

  document.documentElement.appendChild(overlay);
  document.documentElement.style.visibility = "visible";

  function checkPin() {
    const input = document.getElementById("pin-input");
    const error = document.getElementById("pin-error");

    if (input.value === CORRECT_PIN) {
      localStorage.setItem(STORAGE_KEY, "true");
      overlay.remove();
    } else {
      error.textContent = "رمز الدخول غير صحيح، حاول مجدداً";
      input.value = "";
      input.style.borderColor = "#ff5555";
      input.style.boxShadow = "0 0 0 3px rgba(255,85,85,0.2)";
      setTimeout(() => {
        input.style.borderColor = "rgba(2,140,70,0.25)";
        input.style.boxShadow = "";
        error.textContent = "";
      }, 2000);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("pin-input")?.focus();
    document.getElementById("pin-btn")?.addEventListener("click", checkPin);
    document.getElementById("pin-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkPin();
    });
  });
})();
