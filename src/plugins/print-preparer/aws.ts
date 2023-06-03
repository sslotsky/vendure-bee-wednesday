import { S3 } from "aws-sdk";
import AdmZip from "adm-zip";
import https from "https";
import ImageKit from "imagekit";
import { transformOrderLineAssetUrls } from "@vendure/email-plugin";

const s3 = new S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
  signatureVersion: "v4",
});

const imageKit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_SECRET_KEY,
  urlEndpoint: `https://ik.imagekit.io/${process.env.IMAGE_KIT_ID}/`,
});

export async function getImageUrl(fileId: string, transformation: string) {
  const file = await imageKit.getFileDetails(fileId);

  return {
    url: imageKit.url({
      src: `https://ik.imagekit.io/${process.env.IMAGE_KIT_ID}/${transformation}/${file.filePath}`,
      signed: true,
    }),
    filename: file.name,
  };
}

export const downloadImage = (url: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = Buffer.alloc(0);
        response.on("data", (chunk) => {
          data = Buffer.concat([data, chunk]);
        });
        response.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

export const createZipFile = (
  files: { data: Buffer; filename: string }[]
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const zip = new AdmZip();
    for (const file of files) {
      zip.addFile(file.filename, file.data);
    }
    try {
      const zipData = zip.toBuffer();
      resolve(zipData);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
};

export const uploadFile = async (bucket: string, key: string, file: Buffer) => {
  const exp = new Date();
  exp.setMonth(exp.getMonth() + 1);

  try {
    return s3
      .upload({
        Bucket: bucket,
        Key: key,
        Body: file,
        Expires: exp,
      })
      .promise();
  } catch (err) {
    console.error("Failed with: ", err);
    throw err;
  }
};

export async function presignedUrl(bucket: string, key: string) {
  return s3.getSignedUrlPromise("getObject", {
    Bucket: bucket,
    Key: key,
    Expires: 3600,
  });
}
