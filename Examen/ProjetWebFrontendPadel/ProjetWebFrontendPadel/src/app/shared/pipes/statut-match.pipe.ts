import {Pipe, PipeTransform} from '@angular/core';

type StatutMatch = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE';
type TypeMatch = 'PRIVE' | 'PUBLIC';

@Pipe({ name: 'statutMatch', standalone: true })
export class StatutMatchPipe implements PipeTransform {
  transform(value: StatutMatch): string {
    const labels: Record<StatutMatch, string> = {
      EN_ATTENTE: 'En attente',
      CONFIRME: 'Confirmé',
      ANNULE: 'Annulé'
    };
    return labels[value] ?? value;
  }
}

@Pipe({ name: 'typeMatch', standalone: true })
export class TypeMatchPipe implements PipeTransform {
  transform(value: TypeMatch): string {
    return value === 'PRIVE' ? 'Privé' : 'Public';
  }
}
