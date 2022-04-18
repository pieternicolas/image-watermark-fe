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

export const baseImageResizer = async (file: Buffer) => {
  const baseMetadata = await sharp(file).metadata();

  const baseBackground = await sharp({
    create: {
      width: Math.ceil(Number(baseMetadata?.width) * 1.3),
      height: Math.ceil(Number(baseMetadata?.height) * 1.3),
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const baseImage = await sharp(baseBackground)
    .composite([
      {
        input: file,
        gravity: 'center',
      },
    ])
    .png()
    .toBuffer();

  return baseImage;
};

export const baseImageResizerV2 = async (base: Buffer, watermark: Buffer) => {
  // const baseMetadata = await sharp(base).metadata();
  const watermarkMetadata = await sharp(watermark).metadata();

  const background = await sharp({
    create: {
      width: Math.ceil(Number(watermarkMetadata?.width)),
      height: Math.ceil(Number(watermarkMetadata?.height)),
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const baseImage = await sharp(base)
    .resize({
      width: Math.ceil(Number(watermarkMetadata?.width) * 0.8),
      height: Math.ceil(Number(watermarkMetadata?.height) * 0.8),
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const resultImage = await sharp(background)
    .composite([
      { input: baseImage, gravity: 'center' },
      { input: watermark, gravity: 'center' },
    ])
    .toBuffer();

  return resultImage;
};
