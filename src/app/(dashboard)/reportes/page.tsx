import { PageHeader, Card } from "@/components/ui";

const REPORTS = [
  { href: "/api/reportes/cierre-dia", title: "Cierre del día", desc: "Ventas, ganancia y detalle de consumiciones de hoy" },
  { href: "/api/reportes/stock-semanal", title: "Stock semanal", desc: "Inicial, esperado, contado y diferencia del período abierto" },
  { href: "/api/reportes/rentabilidad", title: "Rentabilidad por trago", desc: "Costo, venta, ganancia y margen de cada producto" },
  { href: "/api/reportes/pedido", title: "Pedido a proveedores", desc: "Ítems pendientes agrupados por proveedor" },
];

export default function ReportesPage() {
  return (
    <div>
      <PageHeader title="Reportes" subtitle="Exportá en PDF para imprimir o compartir" />
      <div className="grid sm:grid-cols-2 gap-3">
        {REPORTS.map((r) => (
          <a key={r.href} href={r.href} target="_blank" rel="noreferrer">
            <Card className="hover:border-accent transition h-full">
              <div className="text-2xl mb-2">🖨️</div>
              <h3 className="font-medium text-text">{r.title}</h3>
              <p className="text-sm text-text-muted mt-1">{r.desc}</p>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
