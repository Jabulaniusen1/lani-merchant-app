import client from './client';
import type { Restaurant, MenuItem } from '../types';

interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

const buildImageFormData = (uri: string, name = 'image.jpg'): FormData => {
  const formData = new FormData();
  formData.append('image', { uri, type: 'image/jpeg', name } as unknown as Blob);
  return formData;
};

const multipartHeaders = { 'Content-Type': 'multipart/form-data' };

export const uploadRestaurantLogo = async (
  restaurantId: string,
  uri: string
): Promise<Restaurant> => {
  const res = await client.post(
    `/restaurants/${restaurantId}/logo`,
    buildImageFormData(uri, 'logo.jpg'),
    { headers: multipartHeaders }
  );
  return res.data.data.restaurant as Restaurant;
};

export const uploadRestaurantCover = async (
  restaurantId: string,
  uri: string
): Promise<Restaurant> => {
  const res = await client.post(
    `/restaurants/${restaurantId}/cover`,
    buildImageFormData(uri, 'cover.jpg'),
    { headers: multipartHeaders }
  );
  return res.data.data.restaurant as Restaurant;
};

export const uploadMenuItemImage = async (
  restaurantId: string,
  itemId: string,
  uri: string
): Promise<MenuItem> => {
  const res = await client.post(
    `/restaurants/${restaurantId}/menu/${itemId}/image`,
    buildImageFormData(uri, 'item.jpg'),
    { headers: multipartHeaders }
  );
  return res.data.data.menuItem as MenuItem;
};
