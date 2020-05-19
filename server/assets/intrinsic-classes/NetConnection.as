class NetConnection {
  public var isConnected: Boolean;
  public var uri: String;

  public function connect( targetURI: String): Boolean { }
  public function call( remoteMethod: String, resultObject: Object): Void { }
  public function onStatus(infoObject: Object): Void { }
  public function onResult(infoObject: Object): Void { }
  public function addHeader():Void { }
  public function close(): Void { }
}
