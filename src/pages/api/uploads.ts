import nextConnect from 'next-connect';
import multer from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import JSzip from 'jszip';

interface NextConnectApiRequest extends NextApiRequest {
  files: { [fieldname: string]: Express.Multer.File[] };
}

const zip = new JSzip();

const watermarkMaker = async (file: Buffer, base: Buffer) => {
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

const upload = multer();

const apiRoute = nextConnect({
  onError(error, req: NextConnectApiRequest, res: NextApiResponse) {
    res
      .status(501)
      .json({ error: `Sorry something Happened! ${error.message}` });
  },
  onNoMatch(req: NextConnectApiRequest, res: NextApiResponse) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.use(
  upload.fields([
    { name: 'base' },
    { name: 'tokopedia', maxCount: 1 },
    { name: 'shopee', maxCount: 1 },
    { name: 'lazada', maxCount: 1 },
  ])
);

apiRoute.post(async (req: NextConnectApiRequest, res: NextApiResponse) => {
  try {
    const files = req.files;

    let result: any[] = [];
    for (const base of files?.base) {
      const tokopediaWatermark = await watermarkMaker(
        files?.tokopedia?.[0].buffer,
        base?.buffer
      );
      const shopeeWatermark = await watermarkMaker(
        files?.shopee?.[0].buffer,
        base?.buffer
      );
      const lazadaWatermark = await watermarkMaker(
        files?.lazada?.[0].buffer,
        base?.buffer
      );

      const tokopediaImg = await sharp(base?.buffer)
        .composite([
          {
            input: tokopediaWatermark,
            gravity: 'southeast',
          },
        ])
        .png()
        .toBuffer();
      const shopeeImg = await sharp(base?.buffer)
        .composite([
          {
            input: shopeeWatermark,
            gravity: 'southeast',
          },
        ])
        .png()
        .toBuffer();
      const lazadaImg = await sharp(base?.buffer)
        .composite([
          {
            input: lazadaWatermark,
            gravity: 'southeast',
          },
        ])
        .png()
        .toBuffer();

      result = [
        ...result,
        { fileName: `${base.originalname}-tokopedia.png`, url: tokopediaImg },
        { fileName: `${base.originalname}-shopee.png`, url: shopeeImg },
        { fileName: `${base.originalname}-lazada.png`, url: lazadaImg },
      ];
    }

    for (const { fileName, url } of result) {
      zip.file(fileName, url);
    }

    // Set the name of the zip file in the download
    res.setHeader('Content-Disposition', 'attachment; filename="pictures.zip"');
    // Send the zip file
    zip
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(res)
      .on('finish', function () {
        console.log('out.zip written.');
      });
  } catch (error) {
    console.log(error);
    res.status(400);
  }
});

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
    responseLimit: false,
  },
};

export default apiRoute;
