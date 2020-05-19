class Video {
  public var _alpha: Number;
  public var _height: Number;
  public var _name: String;
  public var _parent: MovieClip;
  public var _rotation: Number;
  public var _visible: Boolean;
  public var _width: Number;
  public var _x: Number;
  public var _xmouse: Number;
  public var _xscale: Number;
  public var _y: Number;
  public var _ymouse: Number;
  public var _yscale: Number;
  public var deblocking: Number;
  public var height: Number;
  public var smoothing: Boolean;
  public var width: Number;
  public function attachVideo(source: Object): Void { }
  public function clear(): Void { }

  // Flash Lite 2.x
  public function close(): Void { }
  public function pause(): Void { }
  public function play(): Boolean { }
  public function resume(): Void { }
  public function stop(): Void { }
}
