class XMLSocket
{

	public function XMLSocket() { }

	public function connect(url:String,port:Number):Boolean { }
	public function send(data:Object):Boolean { }
	public function close():Boolean { }
	public function onData(src:String):Void { }
	public function onXML(src:XML):Void { }
	public function onConnect(success:Boolean):Void { }
	public function onClose():Void { }
}
