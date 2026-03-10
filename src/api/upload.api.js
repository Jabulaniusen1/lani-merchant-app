import client from './client';

const buildImageFormData = (uri, name = 'image.jpg') => {
  const formData = new FormData();
  formData.append('image', { uri, type: 'image/jpeg', name });
  return formData;
};

const multipartHeaders = { 'Content-Type': 'multipart/form-data' };

export const uploadRestaurantLogo = async (restaurantId, uri) => {
  const res = await client.post(
    `/restaurants/${restaurantId}/logo`,
    buildImageFormData(uri, 'logo.jpg'),
    { headers: multipartHeaders }
  );
  return res.data.data.restaurant;
};

export const uploadRestaurantCover = async (restaurantId, uri) => {
  const res = await client.post(
    `/restaurants/${restaurantId}/cover`,
    buildImageFormData(uri, 'cover.jpg'),
    { headers: multipartHeaders }
  );
  return res.data.data.restaurant;
};

export const uploadMenuItemImage = async (restaurantId, itemId, uri) => {
  const res = await client.post(
    `/restaurants/${restaurantId}/menu/${itemId}/image`,
    buildImageFormData(uri, 'item.jpg'),
    { headers: multipartHeaders }
  );
  return res.data.data.menuItem;
};
