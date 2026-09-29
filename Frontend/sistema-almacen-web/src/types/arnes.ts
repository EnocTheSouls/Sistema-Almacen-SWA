export interface Arnes {
  idArnes: number;

  idFamilia: number;
  nombreFamilia: string;

  idProyecto: number;
  nombreProyecto: string;

  numeroParteArnes: string;
  descripcion: string | null;
  nivelDiseno: string;

  fechaVigencia: string | null;
  activo: boolean;
}