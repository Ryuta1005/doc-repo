const setupAutoReload = () => {
  if (window.location.protocol === "file:") {
    return;
  }

  const events = new EventSource("/events");

  events.addEventListener("reload", () => {
    window.location.reload();
  });

  events.onerror = () => {
    // EventSource handles reconnect automatically.
  };
};

setupAutoReload();
