class PrintJob
{
	public function start():Boolean { }
	public function addPage(target:Object, printArea:Object, options:Object, frameNum:Number):Boolean { }
	public function send():Void { }

	public var paperWidth:Number;
	public var paperHeight:Number;
	public var pageWidth:Number;
	public var pageHeight:Number;
	public var orientation:String;
}
