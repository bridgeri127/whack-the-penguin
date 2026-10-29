import { formatMeters, formatWhole } from "./utils.js";

function setVisible(element, visible) {
  if (!element) return;
  element.classList.toggle("is-hidden", !visible);
}

function animateNumber(element, target, duration = 800) {
  if (!element) return;
  const start = performance.now();
  const from = 0;

  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = (from + (target - from) * eased).toFixed(1);
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

export function createUI({
  onStart = () => {},
  onAgain = () => {},
  onShare = () => {},
  onSound = () => {},
} = {}) {
  const elements = {
    titleCard: document.getElementById("titleCard"),
    resultCard: document.getElementById("resultCard"),
    chargePanel: document.getElementById("chargePanel"),
    liveHud: document.getElementById("liveHud"),
    loading: document.getElementById("loading"),
    bestValue: document.getElementById("bestValue"),
    bestCardValue: document.getElementById("bestCardValue"),
    startBtn: document.getElementById("startBtn"),
    againBtn: document.getElementById("againBtn"),
    shareBtn: document.getElementById("shareBtn"),
    soundBtn: document.getElementById("soundBtn"),
    chargeFill: document.getElementById("chargeFill"),
    chargeMarker: document.getElementById("chargeMarker"),
    chargePercent: document.getElementById("chargePercent"),
    chargeLabel: document.getElementById("chargeLabel"),
    chargePanelInner: document.getElementById("chargePanelInner"),
    liveDistance: document.getElementById("liveDistance"),
    liveMeta: document.getElementById("liveMeta"),
    resultDistance: document.getElementById("resultDistance"),
    resultBest: document.getElementById("resultBest"),
    resultRank: document.getElementById("resultRank"),
    resultMessage: document.getElementById("resultMessage"),
    resultPerfect: document.getElementById("resultPerfect"),
    newBestBadge: document.getElementById("newBestBadge"),
    toast: document.getElementById("toast"),
    hint: document.getElementById("hint"),
    flash: document.getElementById("flash"),
  };

  let toastTimer = null;
  let best = 0;
  let muted = false;
  let resultAnimationFrame = null;

  const setBest = (value) => {
    best = Math.max(0, value);
    const label = best > 0 ? formatMeters(best) : "—";
    if (elements.bestValue) elements.bestValue.textContent = label;
    if (elements.bestCardValue) elements.bestCardValue.textContent = label;
  };

  const showTitle = () => setVisible(elements.titleCard, true);
  const hideTitle = () => setVisible(elements.titleCard, false);
  const showResultCard = () => setVisible(elements.resultCard, true);
  const hideResultCard = () => setVisible(elements.resultCard, false);

  const showCharge = (visible) => {
    setVisible(elements.chargePanel, visible);
    if (visible) {
      elements.chargePanel.classList.remove("is-perfect");
      elements.chargePanel.classList.remove("is-active");
      updateCharge(0, false);
      if (elements.chargeLabel)
        elements.chargeLabel.textContent = "HOLD TO CHARGE";
    }
  };

  const setChargeActive = (active) => {
    elements.chargePanel?.classList.toggle("is-active", active);
  };

  const updateCharge = (power, perfect = false) => {
    const clamped = Math.max(0, Math.min(1, power));
    const percent = Math.round(clamped * 100);
    if (elements.chargeFill) elements.chargeFill.style.width = `${percent}%`;
    if (elements.chargeMarker) elements.chargeMarker.style.left = `${percent}%`;
    if (elements.chargePercent)
      elements.chargePercent.textContent = `${percent}%`;
    if (elements.chargePanel) {
      elements.chargePanel.style.setProperty("--power", clamped.toFixed(3));
      elements.chargePanel.classList.toggle("is-perfect", perfect);
    }
    if (elements.chargeLabel) {
      elements.chargeLabel.textContent = perfect ? "PERFECT!" : "CHARGING";
    }
  };

  const showLive = (visible) => setVisible(elements.liveHud, visible);

  const updateLive = (distance, height = 0, state = "AIRBORNE") => {
    if (elements.liveDistance)
      elements.liveDistance.textContent = Math.max(0, distance).toFixed(1);
    if (elements.liveMeta) {
      const heightLabel = height > 1 ? `${Math.round(height)}m HIGH` : state;
      elements.liveMeta.textContent =
        state === "AIRBORNE" ? heightLabel : state;
    }
  };

  const showResult = ({ distance, bestDistance, isNewBest, rank, perfect }) => {
    if (!elements.resultCard) return;
    if (resultAnimationFrame) cancelAnimationFrame(resultAnimationFrame);
    elements.resultDistance.textContent = "0.0";
    animateNumber(elements.resultDistance, distance, 900);
    elements.resultBest.textContent = formatMeters(bestDistance);
    elements.resultRank.textContent = rank.title;
    elements.resultMessage.textContent = rank.message;
    elements.resultPerfect.classList.toggle("is-hidden", !perfect);
    elements.newBestBadge.classList.toggle("is-hidden", !isNewBest);
    elements.resultCard.classList.toggle("is-new-best", isNewBest);
    showResultCard();
  };

  const hideResult = () => hideResultCard();

  const setSoundMuted = (value) => {
    muted = value;
    if (!elements.soundBtn) return;
    elements.soundBtn.classList.toggle("is-muted", muted);
    elements.soundBtn.setAttribute(
      "aria-label",
      muted ? "Unmute sound" : "Mute sound",
    );
    elements.soundBtn.setAttribute(
      "title",
      muted ? "Unmute sound (M)" : "Mute sound (M)",
    );
  };

  const setHint = (text, visible = true) => {
    if (!elements.hint) return;
    elements.hint.textContent = text;
    elements.hint.classList.toggle("is-hidden", !visible);
  };

  const toast = (message, duration = 2200) => {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, duration);
  };

  const flash = () => {
    if (!elements.flash) return;
    elements.flash.classList.remove("is-flashing");
    void elements.flash.offsetWidth;
    elements.flash.classList.add("is-flashing");
  };

  const ready = () => {
    if (elements.loading) {
      elements.loading.classList.add("is-done");
      setTimeout(() => elements.loading?.remove(), 700);
    }
  };

  elements.startBtn?.addEventListener("click", (event) => {
    onStart();
    event.currentTarget.blur();
  });

  elements.againBtn?.addEventListener("click", (event) => {
    onAgain();
    event.currentTarget.blur();
  });

  elements.shareBtn?.addEventListener("click", (event) => {
    onShare();
    event.currentTarget.blur();
  });

  elements.soundBtn?.addEventListener("click", (event) => {
    onSound();
    event.currentTarget.blur();
  });

  setBest(0);
  setSoundMuted(false);
  showCharge(false);
  showLive(false);
  hideResultCard();

  return {
    elements,
    ready,
    setBest,
    showTitle,
    hideTitle,
    showCharge,
    setChargeActive,
    updateCharge,
    showLive,
    updateLive,
    showResult,
    hideResult,
    setSoundMuted,
    setHint,
    toast,
    flash,
    getBest: () => best,
    getMuted: () => muted,
  };
}
