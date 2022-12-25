import { CustomOrderLineFields } from '@vendure/core/dist/entity/custom-entity-fields';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
  interface CustomOrderLineFields {
    transformation: string;
  }
}