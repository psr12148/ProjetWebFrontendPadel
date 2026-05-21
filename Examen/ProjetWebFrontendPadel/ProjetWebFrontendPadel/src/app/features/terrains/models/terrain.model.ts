export interface Terrain {
  id: number;
  siteId: number;
  siteNom: string;
  numero: number;
  nom?: string;
  nomAffichage: string;
}

export interface TerrainRequest {
  siteId: number;
  numero: number;
  nom?: string;
}

export interface CreneauDisponible {
  heureDebut: string;   // "08:00:00"
  heureFin: string;     // "09:30:00"
  disponible: boolean;
}
