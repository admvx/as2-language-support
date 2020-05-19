class Button {
  public var _x: Number;
  public var _y: Number;
  public var _xmouse: Number;
  public var _ymouse: Number;
  public var _xscale: Number;
  public var _yscale: Number;
  public var _width: Number;
  public var _height: Number;
  public var _alpha: Number;
  public var _visible: Boolean;
  public var _target: String;
  public var _rotation: Number;
  public var _name: String;
  public var _framesloaded: Number;
  public var _droptarget: String;
  public var _currentframe: Number;
  public var _totalframes: Number;
  public var _quality: String;
  public var _focusrect: Boolean;
  public var _soundbuftime: Number;
  public var _url: String;
  public var _parent: MovieClip;

  public var useHandCursor: Boolean;
  public var enabled: Boolean;
  public var tabEnabled: Boolean;
  public var tabIndex: Number;
  public var trackAsMenu: Boolean;
  public var menu: ContextMenu;

  public function getDepth(): Number { }
  public function onDragOut(): Void { }
  public function onDragOver(): Void { }
  public function onKillFocus(newFocus: Object): Void { }
  public function onPress(): Void { }
  public function onRelease(): Void { }
  public function onReleaseOutside(): Void { }
  public function onRollOut(): Void { }
  public function onRollOver(): Void { }
  public function onSetFocus(oldFocus: Object): Void { }
  public function onKeyDown(): Void { }
  public function onKeyUp(): Void { }
}
