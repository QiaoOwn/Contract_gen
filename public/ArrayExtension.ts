declare global {
  interface Array<T> {
    /**
     * remove element from current array
     * @param target
     * @param count
     */
    remove(target: T): T[];

    /**
     * sum the array element
     */
    sum(): number;
  }
}

Array.prototype.sum = function (this: number[]): number {
  return this.reduce((p, c) => {
    return p + c;
  }, 0);
};

Array.prototype.remove = function <T>(this: T[], target: T): T[] {
  this.splice(
    this.findIndex((e) => e === target),
    1
  );
  return this;
};

export {};
