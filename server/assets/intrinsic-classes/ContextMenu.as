class ContextMenu {
  public var customItems: Array;
  public var builtInItems: Object;

  public function ContextMenu(callbackFunction: Function) { }
  public function copy(): ContextMenu { }
  public function hideBuiltInItems(): Void { }
  public function onSelect(): Void { }
}
