import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  JobQueue,
  JobQueueService,
  EventBus,
  RequestContextService,
  Order,
  ID,
  TransactionalConnection,
  ProductVariant,
  ProductVariantEvent,
} from "@vendure/core";
import {
  createZipFile,
  downloadImage,
  getImageUrl,
  presignedUrl,
  uploadFile,
} from "./aws";
import { PrintsPreparedEvent } from "./events";

@Injectable()
export class PrintPreparerService implements OnModuleInit {
  private jobQueue: JobQueue<ID>;

  constructor(
    private jobQueueService: JobQueueService,
    private eventBus: EventBus,
    private connection: TransactionalConnection,
    private reqCtxService: RequestContextService
  ) {}

  async populateDimensions(event: ProductVariantEvent) {
    const ctx = await this.reqCtxService.create({
      apiType: "custom",
    });

    const repo = this.connection.getRepository(ctx, ProductVariant);

    const variants = await repo
      .createQueryBuilder("Variants")
      .whereInIds(event.entity.map((v) => v.id))
      .innerJoinAndSelect("Variants.options", "Options")
      .innerJoinAndSelect("Options.group", "Group")
      .getMany();

    await Promise.all(
      variants.map((variant) => {
        const sizeOption = variant.options.find(
          (option) => option.group.code === "size"
        );
        const materialOption = variant.options.find(
          (option) => option.group.code === "material"
        );
        if (!sizeOption || !materialOption) {
          throw new Error(
            "Variants must have a size option and a material option"
          );
        }

        const size = sizeOption.code;
        const pattern = /^(?<width>\d+)x(?<height>\d+)$/;
        const match = size.match(pattern);

        if (match?.groups?.height && match.groups.width) {
          variant.customFields.height = parseInt(match.groups.height, 0);
          variant.customFields.width = parseInt(match.groups.width, 0);
          variant.customFields.material = materialOption.code;
          return repo.save(variant);
        }

        throw new Error(`Size specification error. Expected WxH, got ${size}`);
      })
    );
  }

  async onModuleInit() {
    this.jobQueue = await this.jobQueueService.createQueue({
      name: "package-photos",
      process: async (job) => {
        const ctx = await this.reqCtxService.create({
          apiType: "custom",
        });

        try {
          const order = await this.connection
            .getRepository(ctx, Order)
            .createQueryBuilder("Order")
            .where({ id: job.data })
            .leftJoinAndSelect("Order.lines", "OrderLine")
            .innerJoinAndSelect("OrderLine.productVariant", "Variant")
            .innerJoinAndSelect("OrderLine.items", "OrderItem")
            .getOneOrFail();

          const zip = await createZipFile(
            await Promise.all(
              order.lines.map(async (line) => {
                const { fileId, transformation } = line.customFields;

                const { url, filename } = await getImageUrl(
                  fileId,
                  transformation
                );

                const data = await downloadImage(url);

                const {
                  customFields: { width, height, material },
                } = line.productVariant;

                return {
                  filename: `Quantity ${line.quantity} -- ${material} ${width}x${height} -- ${filename}`,
                  data,
                };
              })
            )
          );

          const [bucket, key] = ["print-orders", `test-order-${order.id}.zip`];
          await uploadFile(bucket, key, zip);
          const r2Url = await presignedUrl(bucket, key);

          const evt = new PrintsPreparedEvent(
            { orderId: order.id, url: r2Url },
            ctx
          );
          this.eventBus.publish(evt);
        } catch (err) {
          console.error(err);
        }
      },
    });
  }

  prepare(order: Order) {
    return this.jobQueue.add(order.id, { retries: 2 });
  }
}
