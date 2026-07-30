// Bump this string on every deploy that should trigger the "actualización
// disponible" banner + "what's new" popup. Add a matching CHANGELOG entry --
// that's what the popup shows. See TECHNICAL-GUIDE.md's deploy checklist.
export const APP_VERSION = "2026-07-30.4";

export const CHANGELOG: Record<string, { title: string; items: string[] }> = {
  "2026-07-30.4": {
    title: "Menú lateral renovado + buscador rápido",
    items: [
      "Los emojis del menú se reemplazaron por íconos más profesionales",
      "El menú ahora está organizado en grupos (Operación, Stock, Catálogo, Análisis, Sistema) en vez de una lista larga",
      "Nuevo buscador rápido — hacé click en \"Buscar\" o apretá Ctrl K (⌘K en Mac) para saltar a cualquier sección escribiendo su nombre",
    ],
  },
  "2026-07-30.3": {
    title: "Nuevo estilo en tarjetas y cifras del Inicio",
    items: [
      "Los números principales del Inicio ahora se ven con una tipografía más elegante",
      "Las cuatro cifras de arriba (Ventas, Ganancia, Dueños/cortesía, Tragos) ahora comparten un mismo panel en vez de tarjetas separadas",
    ],
  },
  "2026-07-30.2": {
    title: "Preparando la nueva tipografía",
    items: [
      "Ajuste técnico interno — todavía no hay cambios visibles de tipografía, eso viene en el próximo paso",
    ],
  },
  "2026-07-30.1": {
    title: "Nueva paleta de colores",
    items: [
      "Empezamos a actualizar el diseño del sistema — primer paso: colores más cálidos y profesionales",
      "Todavía falta actualizar tipografía y el resto de la interfaz — esto sigue en las próximas semanas",
    ],
  },
  "2026-07-28.3": {
    title: "Mejoras en Inventario de Barra + reporte de Cristalería",
    items: [
      "Inventario de Barra: ahora se ve clarito cuántas botellas cerradas hay y cuánto le queda a la abierta (ej: \"2 cerradas + abierta 7/10\")",
      "Inventario de Barra: la Existencia inicial se puede corregir a mano si no coincide con lo que hay realmente",
      "Inventario de Barra: las columnas ahora se llaman igual que en la planilla de papel (Exist., Ent., Venta x Punto, etc.)",
      "Inventario de Barra: aviso nuevo cuando una botella se termina, para abrir una nueva",
      "Inventario de Barra: agregamos una ayuda (❓) que explica qué significa cada columna",
      "Reporte de Cristalería y Vajilla: ahora imprime en una sola hoja",
    ],
  },
  "2026-07-28.2": {
    title: "Botón de novedades (🔔)",
    items: [
      "Nuevo ícono de campana arriba a la izquierda — abrilo cuando quieras para ver todo lo que se agregó al sistema, no solo la última actualización",
    ],
  },
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
