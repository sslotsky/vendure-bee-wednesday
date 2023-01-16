import { OnApplicationBootstrap } from "@nestjs/common";
import {
  EventBus,
  PluginCommonModule,
  VendurePlugin,
  OrderStateTransitionEvent,
} from "@vendure/core";
import { filter } from "rxjs/operators";
import gql from "graphql-tag";
import { PrintPreparerService } from "./service";
import { OrderLineEntityResolver } from "./resolvers";

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [PrintPreparerService],
  shopApiExtensions: {
    schema: gql`
      extend type OrderLine {
        previewUrl: String!
      }
    `,
    resolvers: [OrderLineEntityResolver],
  },
})
export class PrintPreparerPlugin implements OnApplicationBootstrap {
  constructor(
    private eventBus: EventBus,
    private service: PrintPreparerService
  ) {}

  async onApplicationBootstrap() {
    this.eventBus
      .ofType(OrderStateTransitionEvent)
      .pipe(filter((event) => event.toState === "PaymentSettled"))
      .subscribe(async (event) => {
        this.service.prepare(event.order);
      });
  }
}
