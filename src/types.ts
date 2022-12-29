import {
  CustomOrderLineFields,
  CustomProductVariantFields,
} from "@vendure/core/dist/entity/custom-entity-fields";

declare module "@vendure/core/dist/entity/custom-entity-fields" {
  interface CustomOrderLineFields {
    transformation: string;
    fileId: string;
  }

  interface CustomProductVariantFields {
    height: number;
    width: number;
    material: string;
  }
}
