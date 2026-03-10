-- CreateTable
CREATE TABLE "Factura" (
    "id" SERIAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "concesionario" TEXT NOT NULL,
    "comprobante" TEXT NOT NULL,
    "vencimiento" TEXT NOT NULL,
    "monto" TEXT NOT NULL,
    "urlFactura" TEXT,
    "urlPasadas" TEXT,
    "pagada" BOOLEAN NOT NULL DEFAULT false,
    "pagadaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasada" (
    "id" SERIAL NOT NULL,
    "fecha" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "estacion" TEXT NOT NULL,
    "estacionNombre" TEXT NOT NULL,
    "horaPico" BOOLEAN NOT NULL,
    "via" TEXT NOT NULL,
    "dispositivo" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tarifa" DOUBLE PRECISION NOT NULL,
    "bonificacion" DOUBLE PRECISION NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pasada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Factura_comprobante_key" ON "Factura"("comprobante");

-- CreateIndex
CREATE UNIQUE INDEX "Pasada_fecha_hora_estacion_via_facturaId_key" ON "Pasada"("fecha", "hora", "estacion", "via", "facturaId");

-- AddForeignKey
ALTER TABLE "Pasada" ADD CONSTRAINT "Pasada_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
