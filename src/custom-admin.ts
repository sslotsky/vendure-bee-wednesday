import { compileUiExtensions } from "@vendure/ui-devkit/compiler";
// @ts-ignore
import envsubh from "envsub/envsubh";
import path from "path";

if (require.main === module) {
  // Called directly from command line
  customAdminUi({ recompile: true, devMode: false }).then((ui) => {
    ui.compile?.().then(() => {
      process.exit(0);
    });
  });
}

export async function customAdminUi(options: {
  recompile: boolean;
  devMode: boolean;
}) {
  const compiledAppPath = path.join(__dirname, "../admin-ui");
  if (options.recompile) {
    const filePath = path.join(__dirname, "ui-extension", "manage-variants");

    const [templateFile, outputFile] = [
      path.join(filePath, "app.js"),
      path.join(filePath, "app-compiled.js"),
    ];

    await envsubh({
      templateFile,
      outputFile,
      options: { diff: false },
    });

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
