export interface JsonUtility {
  serialize(data: any): string;
  deserialize(data: string): any;
}

export type JsonSerializerOptions = {
  replacer?: (this: any, key: string, value: any) => any;
  space?: string | number;
};

export class JsonUtility implements JsonUtility {
  private options: JsonSerializerOptions;

  constructor(options?: JsonSerializerOptions) {
    if (options) {
      this.options = options;
    } else {
      this.options = {};
    }
  }

  public serialize(data: any): string {
    if (this.options.replacer || this.options.space) {
      return JSON.stringify(data, this.options.replacer, this.options.space);
    }
    return JSON.stringify(data);
  }

  public deserialize(data: string): any {
    return JSON.parse(data);
  }
}
