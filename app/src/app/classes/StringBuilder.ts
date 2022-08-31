export default class StringBuilder {
  private _parts: string[];

  constructor(startValue?: string) {
    this._parts = [];
    if (startValue) {
      this._parts.push(startValue);
    }
  }

  /**
   * Adds a string as part of the whole final string build up.
   */
  public add(text: string): this {
    if (typeof text !== 'undefined' && text !== '') {
      //added "" + just to ensure it is a string for further actions
      this._parts.push('' + text);
    }
    return this;
  }

  public addBuilder(builder: StringBuilder): this {
    this._parts = [...this._parts, ...builder.getTokensCopy()];
    return this;
  }

  public remove(times?: number): this {
    if (times) {
      this._parts = this._parts.splice(0, this._parts.length - times);
    } else {
      this._parts.pop();
    }
    return this;
  }

  /**
   * Add multiple string parts to the whole final string build.
   */
  public addMultiple(
    items: string[],
    separator?: string,
    afterEach?: string | ((t: any) => this)
  ): this {
    const sep = separator ? separator : '';
    items.forEach((a, i, arr) => {
      this.add(a);
      if (i < arr.length - 1) {
        this.add(sep);
        if (afterEach && typeof afterEach === 'string') {
          this.add(afterEach);
        }
      }
    });
    return this;
  }

  /**
   * Add one ore more tabs depending on user purpose
   */
  public addTab(times?: number): this {
    if (times) {
      this._parts.push(Array(times + 1).join('\t'));
    } else {
      this._parts.push('\t');
    }
    return this;
  }

  /**
   * Add one ore more new line on user purpose
   */
  public addNewLine(times?: number): this {
    if (times) {
      this._parts.push(Array(times + 1).join('\n'));
    } else {
      this._parts.push('\n');
    }
    return this;
  }

  /**
   * Replace text for a specific text token, identified by index
   *
   * @param target the target signs to replace
   * @param replacement the string added as replacement
   * @param [index] the index of the text token to replace the text, if not assigned it uses the last token
   *
   * @returns {com.ui5.testing.util.StringBuilder} self reference for chaining
   */
  public replace(
    target: string | RegExp,
    replacement: string,
    index?: number
  ): this {
    const repl = replacement ? replacement : '';
    index = index ? index : this._parts.length - 1;
    if (index < 0) {
      return this;
    }
    this._parts[index] = this._parts[index].replace(target, repl);
    return this;
  }
  //#endregion
  //#region no chaining methods

  /**
   * Returns the number of already added text token.
   *
   * @returns the number of text tokens
   */
  public getNumberOfTextToken(): number {
    return this._parts.length;
  }

  public getTokensCopy(): string[] {
    return [...this._parts];
  }

  /**
   * Simple to string method to return the string out of all parts
   *
   * @returns  the final string
   */
  public toString(): string {
    return this._parts.join('');
  }
  //#endregion
}
