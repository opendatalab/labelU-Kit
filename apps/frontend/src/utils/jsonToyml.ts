// 实现json 转为 yml

export default class JsonToyml {
  public spacing = '  ';

  getType(obj: any) {
    const type = typeof obj;
    if (obj instanceof Array) {
      return 'array';
    } else if (type === 'string') {
      return 'string';
    } else if (type === 'boolean') {
      return 'boolean';
    } else if (type === 'number') {
      return 'number';
    } else if (type === 'undefined' || obj === null) {
      return 'null';
    } else {
      return 'hash';
    }
  }

  convert(obj: any, ret: string[]) {
    const type = this.getType(obj);
    switch (type) {
      case 'array':
        this.convertArray(obj, ret);
        break;
      case 'hash':
        this.convertHash(obj, ret);
        break;
      case 'string':
        this.convertString(obj, ret);
        break;
      case 'null':
        ret.push('null');
        break;
      case 'number':
        ret.push(obj.toString());
        break;
      case 'boolean':
        ret.push(obj ? 'true' : 'false');
        break;
    }
  }

  convertArray(obj: any, ret: string[]) {
    if (obj.length === 0) {
      ret.push('[]');
    }
    for (let i = 0; i < obj.length; i++) {
      const ele = obj[i];
      const recurse: string[] = [];
      this.convert(ele, recurse);

      for (let j = 0; j < recurse.length; j++) {
        ret.push((j === 0 ? '- ' : this.spacing) + recurse[j]);
      }
    }
  }

  convertHash(obj: Record<string, unknown>, ret: string[]) {
    for (const k in obj) {
      const recurse: string[] = [];
      if (obj.hasOwnProperty(k)) {
        // @ts-ignore
        const ele = obj[k];
        this.convert(ele, recurse);
        const type = this.getType(ele);
        if (type === 'string' || type === 'null' || type === 'number' || type === 'boolean') {
          ret.push(this.normalizeString(k) + ': ' + recurse[0]);
        } else {
          ret.push(this.normalizeString(k) + ': ');
          for (let i = 0; i < recurse.length; i++) {
            ret.push(this.spacing + recurse[i]);
          }
        }
      }
    }
  }

  normalizeString(str: string) {
    if (
      str.match(/^[\w]+$/) ||
      str.match(/^[\u4e00-\u9fa5_a-zA-Z0-9_]+$/) ||
      (str.startsWith('^') && str.endsWith('$')) ||
      str.startsWith('http') ||
      (str.startsWith('[') && str.endsWith(']'))
    ) {
      return str;
    } else {
      return '"' + escape(str).replace(/%u/g, '\\u').replace(/%U/g, '\\U').replace(/%/g, '\\x') + '"';
    }
  }

  convertString(obj: string, ret: string[]) {
    ret.push(this.normalizeString(obj));
  }

  json2yaml(obj: Record<string, unknown>) {
    let temp = obj;

    if (typeof temp == 'string') {
      temp = JSON.parse(temp);
    }
    const ret: string[] = [];
    this.convert(temp, ret);
    return ret.join('\n');
  }
}
