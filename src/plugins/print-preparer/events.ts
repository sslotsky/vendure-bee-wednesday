import { VendureEvent, RequestContext, ID } from "@vendure/core";

interface PrintPreparedPayload {
  url: string;
  orderId: ID;
}

export class PrintsPreparedEvent extends VendureEvent {
  public readonly payload: PrintPreparedPayload;
  public readonly ctx: RequestContext;

  constructor(payload: PrintPreparedPayload, ctx: RequestContext) {
    super();
    this.payload = payload;
    this.ctx = ctx;
  }
}
