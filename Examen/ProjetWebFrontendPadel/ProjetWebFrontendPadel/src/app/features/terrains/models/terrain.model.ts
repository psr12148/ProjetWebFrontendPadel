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
