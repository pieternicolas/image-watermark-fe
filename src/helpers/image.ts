import sharp from 'sharp';

export const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as any);
    reader.onerror = (error) => reject(error);
  });

export const applyWatermark = async (background: File, mark: File) => {
  const background64 = await toBase64(background);
  const mark64 = await toBase64(mark);

  const metadata1 = await sharp(mark64).metadata();
  const metadata2 = await sharp(background64).metadata();

  const watermarkBase = await sharp({
    create: {
      width: Math.ceil(
        Number(metadata1?.width) + (Number(metadata2?.width) * 5) / 100
      ),
      height: Math.ceil(
        Number(metadata1?.height) + (Number(metadata2?.height) * 5) / 100
      ),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();

  const watermark = await sharp(watermarkBase)
    .composite([
      {
        input: mark64,
        gravity: 'northwest',
      },
    ])
    .png()
    .toBuffer();

  const img = await sharp(background64)
    .composite([
      {
        input: watermark,
        gravity: 'southeast',
      },
    ])
    .png()
    .toBuffer();

  return img;
};
