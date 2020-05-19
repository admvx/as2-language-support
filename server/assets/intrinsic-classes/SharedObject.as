class SharedObject {
  public static function getLocal(name: String, localPath: String): SharedObject { }
  public static function getRemote(name: String, remotePath: String, persistence: Object): SharedObject { }
  public static function deleteAll(url: String) { }
  public static function getDiskUsage(url: String) { }

  public function connect(myConnection: NetConnection): Boolean { }
  public function send(handlerName: String): Void { }
  public function flush(minDiskSpace: Number): Object { }
  public function close(): Void { }
  public function getSize(): Number { }
  public function setFps(updatesPerSecond: Number): Boolean { }

  public function onStatus(infoObject: Object): Void { }
  public function onSync(objArray: Array): Void { }

  public function clear(): Void { }

  public var data: Object;

  // Flash Lite 2.x
  public static function GetMaxSize(): Number { }
}
