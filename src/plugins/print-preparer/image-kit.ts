import { OrderLine } from "@vendure/core";
import ImageKit from "imagekit";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_SECRET_KEY,
  urlEndpoint: `https://ik.imagekit.io/${process.env.IMAGE_KIT_ID}/`,
});

export async function previewUrl(line: OrderLine) {
  const file = await imageKit.getFileDetails(line.customFields.fileId);

  return imageKit.url({
    src: `https://ik.imagekit.io/${process.env.IMAGE_KIT_ID}/${line.customFields.transformation}:w-200/${file.filePath}`,
    signed: true,
  });
}
