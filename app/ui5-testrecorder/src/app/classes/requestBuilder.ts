export enum RequestMethod {
  POST = 'POST',
  GET = 'GET',
}

export type Request = {
  url: string;
  method: RequestMethod;
  body?: { [key: string]: any };
  message_id?: number;
};

export class RequestBuilder {
  private _method?: RequestMethod;
  private _url?: string;
  private _body?: { [key: string]: any };
  private _searchParams: { [key: string]: string } = {};
  private _pathParams: { [key: string]: string } = {};
  constructor() {}

  public setMethod(type: RequestMethod): this {
    this._method = type;
    return this;
  }

  public setUrl(url: string): this {
    this._url = url;
    return this;
  }

  public setBody(b: { [key: string]: any }): this {
    this._body = b;
    return this;
  }

  public addSearchParam(key: string, value: string): this {
    this._searchParams[key] = value;
    return this;
  }

  public addPathParam(key: string, value: string): this {
    this._pathParams[key] = value;
    return this;
  }

  public build(): Request {
    if (!this._url) {
      throw Error('no url provided, cannot build request');
    }

    if (!this._method) {
      throw Error('no method provided, cannot build request');
    }

    let url = this._url;
    Object.keys(this._pathParams).forEach((k: string) => {
      url = url.replace(`:${k}`, this._pathParams[k]);
    });

    if (Object.keys(this._searchParams).length !== 0) {
      url = url + '?';
      url =
        url +
        Object.keys(this._searchParams)
          .map((k: string) => {
            return `${k}=${this._searchParams[k]}`;
          })
          .join('&');
    }

    return {
      url: url,
      method: this._method,
      body: this._body,
    };
  }
}
