import {
  dummyPaymentHandler,
  DefaultJobQueuePlugin,
  DefaultSearchPlugin,
  VendureConfig,
  DefaultTaxZoneStrategy,
  DefaultTaxLineCalculationStrategy,
} from "@vendure/core";
import {
  orderConfirmationHandler,
  EmailEventListener,
  EmailPlugin,
} from "@vendure/email-plugin";
import { StripePlugin } from "@vendure/payments-plugin/package/stripe";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";
import "dotenv/config";
import path from "path";
import {
  PrintPreparerPlugin,
  PrintsPreparedEvent,
} from "./plugins/print-preparer";
import { customAdminUi } from "./custom-admin";
import { previewUrl } from "./plugins/print-preparer/image-kit";

const IS_DEV = process.env.APP_ENV === "dev";

const printsPreparedHandler = new EmailEventListener("test-email")
  .on(PrintsPreparedEvent)
  .setRecipient(() => "saxosamo@gmail.com")
  .setFrom("sam@saxymofo.com")
  .setSubject("This is a test")
  .setTemplateVars((evt) => ({ payload: evt.payload }));

const customConfirmation = orderConfirmationHandler
  .loadData(async ({ event }) => {
    const lines = event.order.lines.map(async (line) => ({
      ...line,
      previewUrl: await previewUrl(line),
    }));

    const order = {
      ...event.order,
      lines: await Promise.all(lines),
    };

    return { order };
  })
  .setTemplateVars((evt) => {
    return { order: evt.data.order };
  });

const emailHandlers = [printsPreparedHandler, customConfirmation];

export const baseConfig: VendureConfig = {
  taxOptions: {
    taxZoneStrategy: new DefaultTaxZoneStrategy(),
    taxLineCalculationStrategy: new DefaultTaxLineCalculationStrategy(),
  },
  apiOptions: {
    port: 8080,
    adminApiPath: "admin-api",
    shopApiPath: "shop-api",
    // The following options are useful in development mode,
    // but are best turned off for production for security
    // reasons.
    ...(IS_DEV
      ? {
          adminApiPlayground: {
            settings: { "request.credentials": "include" } as any,
          },
          adminApiDebug: true,
          shopApiPlayground: {
            settings: { "request.credentials": "include" } as any,
          },
          shopApiDebug: true,
        }
      : {}),
  },
  authOptions: {
    tokenMethod: ["bearer", "cookie"],
    superadminCredentials: {
      identifier: process.env.SUPERADMIN_USERNAME,
      password: process.env.SUPERADMIN_PASSWORD,
    },
    cookieOptions: {
      secret: process.env.COOKIE_SECRET,
    },
  },
  dbConnectionOptions: IS_DEV
    ? {
        type: "postgres",
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      }
    : {
        type: "postgres",
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
        logging: false,
        url: process.env.DATABASE_URL,
      },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  // When adding or altering custom field definitions, the database will
  // need to be updated. See the "Migrations" section in README.md.
  customFields: {
    ProductVariant: [
      {
        name: "height",
        type: "int",
      },
      {
        name: "width",
        type: "int",
      },
      {
        name: "material",
        type: "string",
      },
    ],
    OrderLine: [
      {
        name: "transformation",
        type: "string",
        validate: async (value: string) => {
          const pattern =
            /^tr:w-\d+(.\d+),h-\d+(.\d+),cm-extract,x-\d+(.\d+),y-\d+(.\d+)?$/;

          if (!pattern.test(value)) {
            return "Transformation not valid";
          }
        },
      },
      { name: "fileId", type: "string" },
    ],
  },
};

export async function getConfig(): Promise<VendureConfig> {
  const customUi = await customAdminUi({ recompile: IS_DEV, devMode: IS_DEV });

  return {
    ...baseConfig,
    plugins: [
      PrintPreparerPlugin,
      StripePlugin.init({
        apiKey: process.env.STRIPE_SECRET_KEY,
        webhookSigningSecret: process.env.STRIPE_WEBHOOK_SIGNING_SECRET,
        // This prevents different customers from using the same PaymentIntent
        storeCustomersInStripe: true,
      }),
      AssetServerPlugin.init({
        route: "assets",
        assetUploadDir: path.join(__dirname, "../static/assets"),
        // For local dev, the correct value for assetUrlPrefix should
        // be guessed correctly, but for production it will usually need
        // to be set manually to match your production url.
        assetUrlPrefix: IS_DEV
          ? undefined
          : "https://vendure-bee.fly.dev//assets",
      }),
      DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
      DefaultSearchPlugin.init({
        bufferUpdates: false,
        indexStockStatus: true,
      }),
      EmailPlugin.init(
        IS_DEV
          ? {
              devMode: true,
              outputPath: path.join(__dirname, "../static/email/test-emails"),
              route: "mailbox",
              handlers: emailHandlers,
              templatePath: path.join(__dirname, "../static/email/templates"),
              globalTemplateVars: {
                // The following variables will change depending on your storefront implementation.
                // Here we are assuming a storefront running at http://localhost:8080.
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: "http://localhost:8080/verify",
                passwordResetUrl: "http://localhost:8080/password-reset",
                changeEmailAddressUrl:
                  "http://localhost:8080/verify-email-address-change",
              },
            }
          : {
              handlers: emailHandlers,
              templatePath: path.join(__dirname, "../static/email/templates"),
              transport: {
                type: "smtp",
                host: process.env.SMTP_HOST,
                port: 587,
                auth: {
                  user: process.env.SENDGRID_USERNAME,
                  pass: process.env.SENDGRID_KEY,
                },
              },
            }
      ),
      AdminUiPlugin.init({
        route: "admin",
        port: 3002,
        ...(IS_DEV
          ? {
              adminUiConfig: {
                apiPort: 8080,
              },
            }
          : {}),
        app: customUi,
      }),
    ],
  };
}
