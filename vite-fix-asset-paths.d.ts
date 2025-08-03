declare module './vite-fix-asset-paths' {
  import { PluginOption } from 'vite';
  
  interface FixAssetPathsOptions {
    patterns?: Array<{
      from: string;
      to: string;
    }>;
  }
  
  declare function fixAssetPaths(options?: FixAssetPathsOptions): PluginOption;
  
  export default fixAssetPaths;
}
