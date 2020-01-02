class XML extends XMLNode
{
	public var contentType:String;
	public var docTypeDecl:String;
	public var ignoreWhite:Boolean;
	public var loaded:Boolean;
	public var status:Number;
	public var xmlDecl:String;
	
	public function XML(text:String) { }
	public function createElement(name:String):XMLNode { }
	public function createTextNode(value:String):XMLNode { }
	public function parseXML(value:String):Void { }
	public function getBytesLoaded():Number { }
	public function getBytesTotal():Number { }
	public function load(url:String):Boolean { }
	public function send(url:String,target:String,method:String):Boolean { }
	public function sendAndLoad(url:String, resultXML):Void { }
	public function onLoad(success:Boolean):Void { }
	public function onData(src:String):Void { }
	public function addRequestHeader(header:Object, headerValue:String):Void { }
}

