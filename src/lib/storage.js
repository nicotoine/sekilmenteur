export function loadSettings(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
}

export function saveSettings(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible (navigation privée) : on ignore
  }
}
