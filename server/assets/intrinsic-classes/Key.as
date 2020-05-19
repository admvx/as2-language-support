class Key {
  public static var ALT: Number = 18;
  public static var ENTER: Number = 13;
  public static var SPACE: Number = 32;
  public static var UP: Number = 38;
  public static var DOWN: Number = 40;
  public static var LEFT: Number = 37;
  public static var RIGHT: Number = 39;
  public static var PGUP: Number = 33;
  public static var PGDN: Number = 34;
  public static var HOME: Number = 36;
  public static var END: Number = 35;
  public static var TAB: Number = 9;
  public static var CONTROL: Number = 17;
  public static var SHIFT: Number = 16;
  public static var ESCAPE: Number = 27;
  public static var INSERT: Number = 45;
  public static var DELETEKEY: Number = 46;
  public static var BACKSPACE: Number = 8;
  public static var CAPSLOCK: Number = 20;
  public static var _listeners: Array;

  public static function getAscii(): Number { }
  public static function getCode(): Number { }
  public static function isAccessible(): Boolean { }
  public static function isDown(code: Number): Boolean { }
  public static function isToggled(code: Number): Boolean { }
  public static function addListener(listener: Object): Void { }
  public static function removeListener(listener: Object): Boolean { }
}
