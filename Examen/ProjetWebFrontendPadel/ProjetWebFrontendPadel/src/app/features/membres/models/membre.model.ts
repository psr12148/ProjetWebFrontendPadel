export type TypeMembre = 'GLOBAL' | 'SITE' | 'LIBRE';

export interface Membre {
  id: number;
  matricule: string;
  typeMembre: TypeMembre;
  typeLabel: string;
  siteId?: number;
  siteNom?: string;
  nom: string;
  prenom: string;
  email: string;
  soldeImpaye: number;
  penaliteJusquA?: string;
  penaliteActive: boolean;
  soldeImpayes: boolean;
}

export interface MembreRequest {
  matricule: string;
  typeMembre: TypeMembre;
  siteId?: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
}

export interface MembreSearchResponse {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nomComplet: string;
}
