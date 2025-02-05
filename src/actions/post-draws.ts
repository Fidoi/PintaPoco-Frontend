'use server';
import axios from 'axios';

export const postDrawings = async (title: string, dataUrl: string) => {
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/drawings`,
      {
        name: title,
        imageData: dataUrl,
      },
      {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
        },
      }
    );
  } catch (error) {
    console.error('Error al guardar el dibujo:', error);
  }
};
