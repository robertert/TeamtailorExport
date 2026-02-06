declare module 'jsonapi-serializer' {
  export interface DeserializerOptions {
    keyForAttribute?: 'camelCase' | 'dash-case' | 'snake_case' | 'lisp-case' | 'spinal-case' | 'kebab-case' | 'underscore_case' | string;
    [key: string]: any;
  }

  export class Deserializer {
    constructor(options?: DeserializerOptions);
    deserialize(data: any): Promise<any>;
  }
}
