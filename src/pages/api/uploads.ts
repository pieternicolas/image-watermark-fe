import nextConnect from 'next-connect';
import multer from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import JSzip from 'jszip';
import { watermarkBorderMaker } from 'helpers/image';

interface NextConnectApiRequest extends NextApiRequest {
  files: { [fieldname: string]: Express.Multer.File[] };
}

const zip = new JSzip();
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
      if (files?.tokopedia) {
        const tokopediaWatermark = await watermarkBorderMaker(
          files?.tokopedia?.[0].buffer,
          base?.buffer
        );

        const tokopediaImg = await sharp(base?.buffer)
          .composite([
            {
              input: tokopediaWatermark,
            },
          ])
          .toBuffer();

        result = [
          ...result,
          { fileName: `${base.originalname}-tokopedia.jpg`, url: tokopediaImg },
        ];
      }

      if (files?.shopee) {
        const shopeeWatermark = await watermarkBorderMaker(
          files?.shopee?.[0].buffer,
          base?.buffer
        );

        const shopeeImg = await sharp(base?.buffer)
          .composite([
            {
              input: shopeeWatermark,
            },
          ])
          .toBuffer();

        result = [
          ...result,
          { fileName: `${base.originalname}-shopee.jpg`, url: shopeeImg },
        ];
      }

      if (files?.lazada) {
        const lazadaWatermark = await watermarkBorderMaker(
          files?.lazada?.[0].buffer,
          base?.buffer
        );

        const lazadaImg = await sharp(base?.buffer)
          .composite([
            {
              input: lazadaWatermark,
            },
          ])
          .toBuffer();

        result = [
          ...result,
          { fileName: `${base.originalname}-lazada.jpg`, url: lazadaImg },
        ];
      }
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
      .on('finish', () => {
        console.log('out.zip written.');
      });
  } catch (error: any) {
    console.log(error, 'error bang');

    res.status(400);
    res.json({ message: error?.message });
  }
});

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
    responseLimit: false,
  },
};

export default apiRoute;
