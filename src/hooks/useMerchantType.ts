import useAuthStore from '../store/auth.store';
import useRestaurantStore from '../store/restaurant.store';

export type MerchantType = 'RESTAURANT' | 'PHARMACY' | 'SUPERMARKET';

export interface MerchantLabels {
  merchantType: MerchantType;
  isRestaurant: boolean;
  /** "item" | "product" */
  item: string;
  /** "Item" | "Product" */
  Item: string;
  /** "items" | "products" */
  items: string;
  /** "Items" | "Products" */
  Items: string;
  /** "menu" | "catalog" */
  menu: string;
  /** "Menu" | "Catalog" */
  Menu: string;
  /** "restaurant" | "pharmacy" | "supermarket" */
  store: string;
  /** "Restaurant" | "Pharmacy" | "Supermarket" */
  Store: string;
}

export default function useMerchantType(): MerchantLabels {
  const user = useAuthStore((s) => s.user);
  const activeRestaurant = useRestaurantStore((s) => s.activeRestaurant);
  const type: MerchantType =
    (user?.merchant?.merchantType as MerchantType) ??
    (activeRestaurant?.merchant?.merchantType as MerchantType) ??
    'RESTAURANT';

  const isRestaurant = type === 'RESTAURANT';

  if (isRestaurant) {
    return {
      merchantType: type,
      isRestaurant: true,
      item: 'item',
      Item: 'Item',
      items: 'items',
      Items: 'Items',
      menu: 'menu',
      Menu: 'Menu',
      store: 'restaurant',
      Store: 'Restaurant',
    };
  }

  const storeLabel = type === 'PHARMACY' ? 'pharmacy' : 'supermarket';
  const StoreLabelCap = type === 'PHARMACY' ? 'Pharmacy' : 'Supermarket';

  return {
    merchantType: type,
    isRestaurant: false,
    item: 'product',
    Item: 'Product',
    items: 'products',
    Items: 'Products',
    menu: 'catalog',
    Menu: 'Catalog',
    store: storeLabel,
    Store: StoreLabelCap,
  };
}
