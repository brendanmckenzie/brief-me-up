document.addEventListener("DOMContentLoaded", () => {
  let lock;

  const strings = {
    activate: "Activate screen lock",
    release: "Release screen lock",
  };

  const btn = document.createElement("button");
  btn.innerText = strings.activate;
  btn.style = "";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    if (lock) {
      lock.release();
      return;
    }

    try {
      lock = await navigator.wakeLock.request("screen");
      btn.innerText = strings.release;
      btn.disabled = false;

      lock.addEventListener("release", () => {
        btn.disabled = false;
        btn.innerText = strings.activate;
        lock = null;
      });
    } catch (e) {
      alert(`Caught ${e.name} acquiring lock: ${e.message}`);
    }
  });

  document.body.appendChild(btn);
});
