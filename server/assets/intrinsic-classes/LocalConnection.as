class LocalConnection
{
	public function LocalConnection() { }

	public function connect(connectionName:String):Boolean { }
	public function send(connectionName:String, methodName:String, args:Object):Boolean { }
	public function close():Void { }
	public function domain():String { }
	public function allowDomain(domain:String):Boolean { }
	public function allowInsecureDomain(domain:String):Boolean { }

	public function onStatus(infoObject:Object):Void { }
}


