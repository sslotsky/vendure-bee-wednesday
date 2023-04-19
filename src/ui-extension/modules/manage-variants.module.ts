import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { hostExternalFrame } from "@vendure/admin-ui/core";

@NgModule({
  imports: [
    RouterModule.forChild([
      hostExternalFrame({
        path: "",
        breadcrumbLabel: "Manage Custom Print Variants",
        extensionUrl: "./assets/manage-variants/index.html",
        openInNewTab: false,
      }),
    ]),
  ],
})
export class ManageVariantsExtensionModule {}
