export interface SesamDataItem {
  catPro: string;
  dateData: string; // Format: "YYYYMM"
  editeur: string;
  groupe: string;
  progiciel: string;
  nbPsFacturation: number;
}

export interface DataFilters {
  profession?: string;
  startDate?: Date;
  editorName?: string;
}

export interface SesamApiResponse {
  chiffres: SesamDataItem[];
}
