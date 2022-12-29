import { OnApplicationBootstrap } from "@nestjs/common";
import {
  EventBus,
  PluginCommonModule,
  VendurePlugin,
  OrderStateTransitionEvent,
} from "@vendure/core";
import { filter } from "rxjs/operators";
import { PrintPreparerService } from "./service";

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [PrintPreparerService],
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
