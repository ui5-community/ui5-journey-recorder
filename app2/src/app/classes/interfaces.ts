export interface Stringify {
  toString(): string;
}

export interface Equals<T> {
  equalsTo(other: T): boolean;
}
