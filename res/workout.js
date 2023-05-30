let wakeLock = null;

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      console.log("Screen Wake Lock released:", wakeLock.released);
    });
    console.log("Screen Wake Lock released:", wakeLock.released);
  } catch (err) {
    // TODO: fix this. NotAllowedError, Permission was denied
    console.error(`${err.name}, ${err.message}`);
  }
};
requestWakeLock();
