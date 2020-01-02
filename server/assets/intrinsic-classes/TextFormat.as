class TextFormat
{
	public var font:String;
	public var size:Number;
	public var color:Number;
	public var url:String;
	public var target:String;
	public var bold:Boolean;
	public var italic:Boolean;
	public var underline:Boolean;
	public var align:String;
	public var leftMargin:Number;
	public var rightMargin:Number;
	public var indent:Number;
	public var leading:Number;
	public var blockIndent:Number;
	public var tabStops:Array;
	public var bullet:Boolean;
	public function TextFormat(font:String,size:Number,textColor:Number,bold:Boolean,italic:Boolean,underline:Boolean,url:String,window:String,align:String,leftMargin:Number,rightMargin:Number,indent:Number,leading:Number) { }
	public function getTextExtent(text:String):Object { }
}


