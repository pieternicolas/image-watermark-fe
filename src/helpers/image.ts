import sharp from 'sharp';

export const watermarkCornerMaker = async (file: Buffer, base: Buffer) => {
  const watermarkMetadata = await sharp(file).metadata();
  const baseMetadata = await sharp(base).metadata();

  const watermarkBase = await sharp({
    create: {
      width: Math.ceil(
        Number(watermarkMetadata?.width) +
          (Number(baseMetadata?.width) * 5) / 100
      ),
      height: Math.ceil(
        Number(watermarkMetadata?.height) +
          (Number(baseMetadata?.height) * 5) / 100
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
        input: file,
        gravity: 'northwest',
      },
    ])
    .png()
    .toBuffer();

  return watermark;
};

export const watermarkBorderMaker = async (file: Buffer, base: Buffer) => {
  const baseMetadata = await sharp(base).metadata();

  const watermark = await sharp(file)
    .resize({
      width: Number(baseMetadata?.width),
      height: Number(baseMetadata?.height),
      fit: 'fill',
    })
    .png()
    .toBuffer();

  return watermark;
};
