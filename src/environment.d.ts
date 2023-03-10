export {};

// Here we declare the members of the process.env object, so that we
// can use them in our application code in a type-safe manner.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_ENV: string;
      COOKIE_SECRET: string;
      SUPERADMIN_USERNAME: string;
      SUPERADMIN_PASSWORD: string;
      DB_HOST: string;
      DB_PORT: number;
      DB_NAME: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_SCHEMA: string;
      DATABASE_URL: string;
      STRIPE_WEBHOOK_SIGNING_SECRET: string;
      STRIPE_SECRET_KEY: string;
      SMTP_HOST: string;
      SENDGRID_USERNAME: string;
      SENDGRID_KEY: string;
      IMAGE_KIT_ID: string;
      IMAGE_KIT_PUBLIC_KEY: string;
      IMAGE_KIT_SECRET_KEY: string;
    }
  }
}
