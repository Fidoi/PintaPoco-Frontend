'use server';

export type Drawing = {
  id: string;
  name: string;
  imageUrl: string;
  isNew: boolean;
};

export async function getDrawings(): Promise<Drawing[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}drawings`, {
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY!,
      },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Error al obtener los dibujos');

    return await response.json();
  } catch (error) {
    console.error('Error al obtener dibujos:', error);
    return [];
  }
}
