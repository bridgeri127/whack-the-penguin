export function initInput({
  onPrimary = () => {},
  onRelease = () => {},
  onSoundToggle = () => {},
  onMuteKey = null,
} = {}) {
  let pointerDown = false;
  let keyDown = false;

  const isInteractive = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest("button, a, input, select, textarea, [data-ui]"),
    );
  };

  const handlePrimary = (source) => {
    if (pointerDown || keyDown) return;
    if (source === "pointer") pointerDown = true;
    else keyDown = true;
    onPrimary(source);
  };

  const handleRelease = (source) => {
    if (source === "pointer") {
      if (!pointerDown) return;
      pointerDown = false;
    } else {
      if (!keyDown) return;
      keyDown = false;
    }
    onRelease(source);
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractive(event.target)) return;
    if (event.target.closest?.("[data-no-input]")) return;
    handlePrimary("pointer");
  };

  const onPointerUp = () => {
    handleRelease("pointer");
  };

  const onKeyDown = (event) => {
    if (
      event.code === "Space" ||
      event.code === "Enter" ||
      event.code === "NumpadEnter"
    ) {
      if (isInteractive(document.activeElement)) return;
      event.preventDefault();
      if (event.repeat) return;
      handlePrimary("key");
    } else if (event.code === "KeyM") {
      if (onMuteKey) onMuteKey();
      else onSoundToggle();
    }
  };

  const onKeyUp = (event) => {
    if (
      event.code === "Space" ||
      event.code === "Enter" ||
      event.code === "NumpadEnter"
    ) {
      handleRelease("key");
    }
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => {
    pointerDown = false;
    keyDown = false;
  });

  return {
    isPressed: () => pointerDown || keyDown,
  };
}
