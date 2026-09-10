const application = document.querySelector<HTMLElement>("#app");

if (!application) {
  throw new Error("Elemen aplikasi tidak ditemukan.");
}

application.dataset.ready = "true";
