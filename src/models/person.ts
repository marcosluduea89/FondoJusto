// Persona participante del fondo familiar.
export type PersonId = "marcos" | "wife";

export interface Person {
  id: PersonId;
  name: string;
}

// Personas iniciales del MVP; se centralizan para evitar strings repetidos.
export const PEOPLE: Person[] = [
  { id: "marcos", name: "Marcos" },
  { id: "wife", name: "Esposa" }
];
