class Array {
  public static var CASEINSENSITIVE: Number;
  public static var DESCENDING: Number;
  public static var UNIQUESORT: Number;
  public static var RETURNINDEXEDARRAY: Number;
  public static var NUMERIC: Number;

  public var length: Number;

  public function push(value :  Object): Number { }
  public function pop(): Object { }
  public function concat(value: Object): Array { }
  public function shift(): Object { }
  public function unshift(value: Object): Number { }
  public function slice(startIndex: Number, endIndex: Number): Array { }
  public function join(delimiter: String): String { }
  public function splice(startIndex: Number, deleteCount: Number, value: Object): Array { }
  public function toString(): String { }
  public function sort(compare: Object, options: Number): Array { }
  public function reverse(): Void { }
  public function sortOn(key: Object, options: Object): Array { }
  public function Array(elements): Array { }
}
