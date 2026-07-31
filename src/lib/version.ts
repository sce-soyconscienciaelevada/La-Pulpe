// Bump this string on every deploy that should trigger the "actualización
// disponible" banner + "what's new" popup. Add a matching CHANGELOG entry --
// that's what the popup shows. See TECHNICAL-GUIDE.md's deploy checklist.
export const APP_VERSION = "2026-07-31.5";

export const CHANGELOG: Record<string, { title: string; items: string[] }> = {
  "2026-07-31.5": {
    title: "Gráfico fijo al pasar el mouse + torta interactiva",
    items: [
      "Inicio: el recuadro de detalle del gráfico ya no salta de lugar al mover el mouse — queda fijo arriba a la derecha",
      "Inicio: la torta de \"Ventas por categoría\" ahora responde al pasar el mouse — resalta la porción y muestra su nombre, monto y porcentaje en el centro",
    ],
  },
  "2026-07-31.4": {
    title: "Arreglo: Heladeras \"semana siguiente\" + gráfico del Inicio",
    items: [
      "Heladeras: \"Semana siguiente\" se había quedado pegado en la misma semana por un problema de huso horario en el servidor — ahora avanza bien, semana por semana",
      "Inicio: el gráfico de ventas a veces se veía \"cortado\" al pasar el mouse — el globito de info tapaba parte de la curva, ahora se corre al costado",
      "Inicio: la torta de \"Ventas por categoría\" se acomodó para no salirse de su tarjeta en pantallas angostas",
    ],
  },
  "2026-07-31.3": {
    title: "Botones clickeables + nombres prolijos + iconos nuevos",
    items: [
      "Los botones de toda la app ahora se ven clickeables (antes se veían iguales estén activos o no)",
      "Heladeras: el botón \"Semana siguiente\" avisa mientras carga la semana",
      "Nombres de productos, personas y proveedores se corrigen solos — primera letra en mayúscula y acentos en las palabras más comunes, aunque los cargues todo en minúscula",
      "Productos: nuevo botón para volver al listado sin usar el menú",
      "Feedback: los reportes resueltos piden una nota (\"¿qué se hizo?\") y pasan a un log separado — la lista activa queda corta",
      "Los emojis de bebidas se reemplazaron por íconos de vaso simples, según la categoría del producto",
    ],
  },
  "2026-07-31.2": {
    title: "Inicio: números de ejemplo hasta que arranques a cargar de verdad",
    items: [
      "El Inicio ahora muestra cifras de ejemplo (marcadas como tal) hasta que aprietes \"Empezar a cargar mis datos reales\"",
      "Al confirmar, se guarda ese día como el primer día real — todo lo cargado antes queda afuera de comparaciones y gráficos",
      "\"Últimas consumiciones\" siempre muestra datos reales, nunca ejemplos",
    ],
  },
  "2026-07-31.1": {
    title: "Arreglo importante: el día cambiaba a las 21:00",
    items: [
      "El sistema cerraba el día a las 21:00 de Córdoba en vez de a medianoche, así que una noche de trabajo se partía en dos días distintos",
      "Ahora el día va de medianoche a medianoche, hora de Córdoba, tanto en el Registro diario como en Heladeras",
    ],
  },
  "2026-07-30.7": {
    title: "Arreglo: el Inicio no cargaba",
    items: [
      "El Inicio tiraba error al abrirlo por una falla del gráfico nuevo — ya está arreglado y todas las secciones cargan bien",
    ],
  },
  "2026-07-30.6": {
    title: "Inicio renovado — gráfico, mezcla de consumo y torta por categoría",
    items: [
      "Inicio: las 4 cifras de arriba ahora muestran comparación real contra el mismo día de la semana pasada (no solo el número de hoy)",
      "Inicio: nuevo gráfico de ventas de los últimos 14 días o del mes, con detalle al pasar el mouse o tocar cada punto",
      "Inicio: nueva barra de mezcla de consumo (venta / dueños / cortesía / banda) y torta de ventas por categoría",
      "Inicio: tabla de últimas consumiciones en vivo con hora, tipo, para quién, importe y margen",
    ],
  },
  "2026-07-30.5": {
    title: "Nuevos gráficos (todavía no visibles)",
    items: [
      "Ajuste técnico interno — se prepararon los componentes de gráfico interactivo, barra de distribución y torta que van a aparecer en el Inicio en el próximo paso",
    ],
  },
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
