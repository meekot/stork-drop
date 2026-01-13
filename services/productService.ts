type ProductDetails = { name?: string | null; price?: number | null; currency?: string | null; imageUrl?: string | null };

const postJson = async <T>(url: string, body: Record<string, unknown>): Promise<T | null> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
};

export const fetchProductImage = async (url: string): Promise<string | null> => {
  const data = await postJson<{ imageUrl: string | null }>('/api/product/image', { url });
  return data?.imageUrl ?? null;
};

export const extractProductDetails = async (url: string): Promise<ProductDetails | null> => {
  const data = await postJson<{ details: ProductDetails | null }>('/api/product/details', { url });
  return data?.details ?? null;
};
