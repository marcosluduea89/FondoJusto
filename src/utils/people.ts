import { PEOPLE, Person, PersonId } from "../models";

// Devuelve las personas configuradas o las del MVP si el backup/dato viejo aun no las tiene.
export function getConfiguredPeople(people?: Person[]): Person[] {
  return people?.length ? people : PEOPLE;
}

// Busca el nombre visible de una persona manteniendo fallback por id.
export function getPersonName(people: Person[] | undefined, personId: PersonId): string {
  return getConfiguredPeople(people).find((person) => person.id === personId)?.name ?? personId;
}
