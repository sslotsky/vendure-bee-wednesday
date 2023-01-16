import { Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { Ctx, RequestContext, OrderLine } from "@vendure/core";
import { previewUrl } from "./image-kit";

@Resolver("OrderLine")
export class OrderLineEntityResolver {
  @ResolveField()
  async previewUrl(@Ctx() ctx: RequestContext, @Parent() line: OrderLine) {
    return previewUrl(line);
  }
}
