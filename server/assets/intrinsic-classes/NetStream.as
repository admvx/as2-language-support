class NetStream {
  public var time: Number;
  public var currentFps: Number;
  public var bufferTime: Number;
  public var bufferLength: Number;
  public var liveDelay: Number;
  public var bytesLoaded: Number;
  public var bytesTotal: Number;

  public function NetStream(connection: NetConnection) { }
  public function onMetaData(info: Object): Void { }
  public function onStatus(info: Object): Void { }
  public function publish(name: Object, type: String): Void { }
  public function play(name: Object, start: Number, len: Number, reset: Object) { }
  public function receiveAudio(flag: Boolean): Void { }
  public function receiveVideo(flag: Object): Void { }
  public function pause(flag: Boolean): Void { }
  public function seek(offset: Number): Void { }
  public function close(): Void { }
  public function attachAudio(theMicrophone: Microphone): Void { }
  public function attachVideo(theCamera: Camera,snapshotMilliseconds: Number): Void { }
  public function send(handlerName: String): Void { }
  public function setBufferTime(bufferTime: Number): Void { }

  public function onPlayStatus(info: Object): Void { }
  public function onCuePoint(info: Object): Void { }
}
