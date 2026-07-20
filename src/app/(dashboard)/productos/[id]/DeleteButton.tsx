"use client";

export function DeleteButton({ action }: { action: () => void }) {
  return (
    <button
      onClick={() => {
        if (confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
          action();
        }
      }}
      className="text-loss text-sm underline"
    >
      Eliminar producto
    </button>
  );
}
