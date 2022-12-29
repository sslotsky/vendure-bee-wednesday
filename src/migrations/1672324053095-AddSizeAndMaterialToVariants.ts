import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSizeAndMaterialToVariants1672324053095 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsHeight" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsWidth" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "customFieldsMaterial" character varying(255)`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsMaterial"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsWidth"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "customFieldsHeight"`, undefined);
   }

}
