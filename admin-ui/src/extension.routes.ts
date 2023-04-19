export const extensionRoutes = [  {
    path: 'extensions/manage-variants',
    loadChildren: () => import('./extensions/1d14bdaacbe7ea3cbf8550790f9dfbf2c9ab1719aa3180aec67e064aa919acbf/manage-variants.module').then(m => m.ManageVariantsExtensionModule),
  }];
