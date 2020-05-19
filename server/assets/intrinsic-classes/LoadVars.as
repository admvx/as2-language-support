class LoadVars {
  public var contentType: String;
  public var loaded: Boolean;
  public var _customHeaders: Array;

  public function LoadVars();
  public function addRequestHeader(header: Object, headerValue: String): Void;
  public function load(url: String): Boolean;
  public function send(url: String, target: String, method: String): Boolean;
  public function sendAndLoad(url: String, target, method: String): Boolean;
  public function getBytesLoaded(): Number;
  public function getBytesTotal(): Number;
  public function decode(queryString: String): Void;
  public function toString(): String;
  public function onLoad(success: Boolean): Void;
  public function onData(src: String): Void;
}
