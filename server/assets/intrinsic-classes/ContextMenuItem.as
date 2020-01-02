class ContextMenuItem
{
	public var caption:String;
	public var separatorBefore:Boolean;
	public var enabled:Boolean;
	public var visible:Boolean;
	public function ContextMenuItem(caption:String,callbackFunction:Function,separatorBefore:Boolean,enabled:Boolean,visible:Boolean) { }
	public function copy():ContextMenuItem { }
	public function onSelect():Void { }
}
