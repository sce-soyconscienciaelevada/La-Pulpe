// Bump this string on every deploy that should trigger the "actualización
// disponible" banner + "what's new" popup. Add a matching CHANGELOG entry --
// that's what the popup shows. See TECHNICAL-GUIDE.md's deploy checklist.
export const APP_VERSION = "2026-07-22.2";

export const CHANGELOG: Record<string, { title: string; items: string[] }> = {
  "2026-07-22.2": {
    title: "Capturas en Feedback + avisos de actualización",
    items: [
      "Pegá una captura de pantalla (Ctrl+V) al reportar algo en Feedback",
      "El dashboard ahora te avisa cuando hay una actualización nueva, con un botón para recargar",
    ],
  },
  "2026-07-22.1": {
    title: "Recetario",
    items: ["Ficha técnica por trago: foto, descripción, preparación y guarnición"],
  },
};
