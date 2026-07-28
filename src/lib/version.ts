// Bump this string on every deploy that should trigger the "actualización
// disponible" banner + "what's new" popup. Add a matching CHANGELOG entry --
// that's what the popup shows. See TECHNICAL-GUIDE.md's deploy checklist.
export const APP_VERSION = "2026-07-28.1";

export const CHANGELOG: Record<string, { title: string; items: string[] }> = {
  "2026-07-28.1": {
    title: "Heladeras + Ventas POS + Inventario de Barra",
    items: [
      "Nuevo: Control Temperatura Heladeras — registro semanal por unidad, incidencias y reporte imprimible",
      "Nuevo: Ventas POS — cargá el total semanal del ticket por categoría, compará con la semana anterior y vinculá códigos a tus productos",
      "Nuevo: Inventario de Barra — control diario de botellas abiertas por sistema de puntos, con reporte semanal",
      "Productos: nuevo campo \"Puntos de conteo\" para sumar un producto a Inventario de Barra",
      "Feedback: si adjuntás una captura, ahora también llega como imagen a Telegram (antes solo texto)",
    ],
  },
  "2026-07-24.1": {
    title: "Carta real cargada + costos y duplicar producto",
    items: [
      "Precios de venta reales de la carta ya están cargados en el sistema",
      "Precios & Rentabilidad: ahora podés cargar el costo por envase directo en la tabla",
      "Inventario: botón 📋 para duplicar un producto y crear variantes rápido (ej: Jarra Naranja, Jarra Frutilla)",
    ],
  },
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
