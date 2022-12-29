import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  JobQueue,
  JobQueueService,
  EventBus,
  RequestContextService,
  Order,
  ID,
  TransactionalConnection,
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

                console.log(line);
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
