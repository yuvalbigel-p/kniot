export type IconId =
  | 'produce' | 'fruit' | 'dairy' | 'eggs' | 'bakery' | 'grains'
  | 'meat' | 'fish' | 'frozen' | 'pantry' | 'spices' | 'snacks'
  | 'sweets' | 'drinks' | 'coffee' | 'cleaning' | 'bath' | 'paper'
  | 'baby' | 'pets' | 'pharmacy' | 'home' | 'party' | 'other';

export interface Section { id: string; name: string; icon: IconId }
export interface Item { id: string; sectionId: string; name: string; target: number }
export interface ShouldList {
  schema: 1;
  updatedAt: string;
  sections: Section[];
  items: Item[];
  /** Started from an empty list: no stock-count step, the list goes straight to shopping. */
  blank?: boolean;
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
