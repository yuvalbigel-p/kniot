export type IconId =
  | 'produce' | 'fruit' | 'dairy' | 'eggs' | 'bakery' | 'grains'
  | 'meat' | 'fish' | 'frozen' | 'pantry' | 'spices' | 'snacks'
  | 'sweets' | 'drinks' | 'coffee' | 'cleaning' | 'bath' | 'paper'
  | 'baby' | 'pets' | 'pharmacy' | 'home' | 'party' | 'other'
  | 'sauce' | 'scale' | 'pasta' | 'canned' | 'cart' | 'gift' | 'plant' | 'tools' | 'heart' | 'office';

export interface Section { id: string; name: string; icon: IconId }
export interface Item { id: string; sectionId: string; name: string; target: number }
export interface ShouldList {
  schema: 1;
  updatedAt: string;
  sections: Section[];
  items: Item[];
}
export type Counts = Record<string, number>;
export interface ShoppingLine {
  id: string;
  name: string;
  qty: number;
  checked: boolean;
  itemId?: string;
  sectionId?: string;
  oneOff: boolean;
}
export interface ShoppingList { createdAt: string; lines: ShoppingLine[] }
export type Tab = 'should' | 'check' | 'shop';
export interface UiState { lastTab: Tab }
