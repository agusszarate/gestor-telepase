export interface Factura {
  periodo: string;
  concesionario: string;
  comprobante: string;
  vencimiento: string;
  monto: string;
  url_factura?: string;
  url_pasadas?: string;
  pagada?: boolean;
  pagadaAt?: string;
}

export interface Pasada {
  fecha: string;
  hora: string;
  estacion: string;
  estacionNombre: string;
  horaPico: boolean;
  via: string;
  dispositivo: string;
  patente: string;
  categoria: string;
  tarifa: number;
  bonificacion: number;
}

export interface PasadasStats {
  totalTarifa: number;
  totalBonificacion: number;
  maxTarifa: number;
  avgTarifa: number;
  pasadasHoraPico: number;
  totalHoraPico: number;
  pasadasNormal: number;
  totalNormal: number;
  estacionesSorted: [string, { count: number; total: number }][];
  maxEstacionTotal: number;
  fechasSorted: [string, { count: number; total: number }][];
}
