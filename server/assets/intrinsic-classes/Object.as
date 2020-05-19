class Object {
  public static var prototype: Object;
  public static function registerClass(name: String, theClass: Function): Boolean { }

  public function Object(value: Object): Object { }
  public function watch(name: String, callback: Function, userData: Object): Boolean { }
  public function unwatch(name: String): Boolean { }
  public function addProperty(name: String, getter: Function, setter: Function): Boolean { }
  public function hasOwnProperty(name: String): Boolean { }
  public function isPropertyEnumerable(name: String): Boolean { }
  public function isPrototypeOf(theClass: Object): Boolean { }
  public function toString(): String { }
  public function valueOf(): Object { }

  public var __proto__: Object;
  public var constructor: Function;
}
