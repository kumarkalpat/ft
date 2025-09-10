export interface Person {
  id: string;
  name: string;
  alias?: string;
  gender: 'Male' | 'Female' | 'Other';
  partnerId?: string;
  parentsIds: string[];
  imageUrl?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  marriageDate?: string;
  marriagePlace?: string;
  bio?: string;
  spouse?: Person;
  children: Person[];
}