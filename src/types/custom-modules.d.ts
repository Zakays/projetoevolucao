// Declarations for third-party packages without type definitions
// Add more module names here as needed

declare module 'vite-plugin-pwa';

declare module '@babel/traverse' {
  import type * as t from '@babel/types';
  export type NodePath<T = any> = {
    node: T;
    parent: any;
    parentKey?: any;
    findParent: (fn: (p: NodePath<any>) => boolean) => NodePath<any> | null;
    replaceWith: (node: any) => void;
    isJSXAttribute?: () => boolean;
    isObjectProperty?: () => boolean;
  } & any;
  const traverse: any;
  export default traverse;
}

declare module '@babel/generator' {
  const generate: any;
  export default generate;
}
