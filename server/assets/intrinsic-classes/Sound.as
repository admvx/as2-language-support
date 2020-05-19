class Sound {
  public var duration: Number;
  public var id3: Object;
  public var ID3: Object;
  public var position: Number;

  public function Sound(target: Object) { }
  public function onLoad(success: Boolean): Void { }
  public function onSoundComplete(): Void { }
  public function onID3(): Void { }
  public function getPan(): Number { }
  public function getTransform(): Object { }
  public function getVolume(): Number { }
  public function setPan(value: Number): Void { }
  public function setTransform(transformObject: Object): Void { }
  public function setVolume(value: Number): Void { }
  public function stop(linkageID: String): Void { }
  public function attachSound(id: String): Void { }
  public function start(secondOffset: Number, loops: Number): Void { }
  public function getDuration(): Number { }
  public function setDuration(value: Number): Void { }
  public function getPosition(): Number { }
  public function setPosition(value: Number): Void { }
  public function loadSound(url: String, isStreaming: Boolean): Void { }
  public function getBytesLoaded(): Number { }
  public function getBytesTotal(): Number { }
}
