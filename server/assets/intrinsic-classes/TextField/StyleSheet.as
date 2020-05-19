class TextField.StyleSheet {
  public function getStyle(name: String): Object;
  public function setStyle(name: String,style: Object): Void;
  public function clear(): Void;
  public function getStyleNames(): Array;
  public function transform(style: Object): TextFormat;
  public function parseCSS(cssText: String): Boolean;
  public function parse(cssText: String): Boolean;
  public function load(url: String): Boolean;
  public function onLoad(success: Boolean): Void;
}
