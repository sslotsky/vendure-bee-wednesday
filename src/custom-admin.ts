import { compileUiExtensions } from "@vendure/ui-devkit/compiler";
import path from "path";

if (require.main === module) {
  // Called directly from command line
  customAdminUi({ recompile: true, devMode: false })
    .compile?.()
    .then(() => {
      process.exit(0);
    });
}

export function customAdminUi(options: {
  recompile: boolean;
  devMode: boolean;
}) {
  const compiledAppPath = path.join(__dirname, "../admin-ui");
  if (options.recompile) {
    return compileUiExtensions({
      outputPath: compiledAppPath,
      extensions: [
        {
          extensionPath: path.join(__dirname, "ui-extension/modules"),
          ngModules: [
            {
              type: "lazy",
              route: "manage-variants",
              ngModuleFileName: "manage-variants.module.ts",
              ngModuleName: "ManageVariantsExtensionModule",
            },
          ],
          staticAssets: [path.join(__dirname, "ui-extension/manage-variants")],
        },
      ],
      devMode: options.devMode,
    });
  } else {
    return {
      path: path.join(compiledAppPath, "dist"),
    };
  }
}
