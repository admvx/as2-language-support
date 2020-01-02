class TextField
{
	public var _x:Number;
	public var _y:Number;
	public var _xmouse:Number;
	public var _ymouse:Number;
	public var _xscale:Number;
	public var _yscale:Number;
	public var _width:Number;
	public var _height:Number;
	public var _alpha:Number;
	public var _visible:Boolean;
	public var _target:String;
	public var _rotation:Number;
	public var _name:String;
	public var _framesloaded:Number;
	public var _droptarget:String;
	public var _currentframe:Number;
	public var _totalframes:Number;
	public var _quality:String;
	public var _focusrect:Boolean;
	public var _soundbuftime:Number;
	public var _url:String;
	public var _parent:MovieClip;

	public var autoSize:Object;
	public var background:Boolean;
	public var backgroundColor:Number;
	public var border:Boolean;
	public var borderColor:Number;
	public var bottomScroll:Number;
	public var condenseWhite:Boolean;
	public var embedFonts:Boolean;
	public var hscroll:Number;
	public var html:Boolean;
	public var htmlText:String;
	public var length:Number;
	public var maxChars:Number;
	public var maxhscroll:Number;
	public var maxscroll:Number;
	public var multiline:Boolean;
	public var password:Boolean;
	public var restrict:String;
	public var scroll:Number;
	public var selectable:Boolean;
	public var tabEnabled:Boolean;
	public var tabIndex:Number;
	public var text:String;
	public var textColor:Number;
	public var textHeight:Number;
	public var textWidth:Number;
	public var type:String;
	public var variable:String;
	public var wordWrap:Boolean;
	public var mouseWheelEnabled:Boolean;

	public var styleSheet:TextField.StyleSheet;

	public function replaceText(beginIndex:Number,endIndex:Number,newText:String):Void { }
	public function replaceSel(newText:String):Void { }
	public function getTextFormat(beginIndex:Number,endIndex:Number):TextFormat { }
	public function setTextFormat():Void { }
	public function removeTextField():Void { }
	public function getNewTextFormat():TextFormat { }
	public function setNewTextFormat(tf:TextFormat):Void { }
	public function getDepth():Number { }
	public function addListener(listener:Object):Boolean { }
	public function removeListener(listener:Object):Boolean { }
	public static function getFontList():Array { }

	public function onChanged(changedField:TextField):Void { }
	public function onKillFocus(newFocus:Object):Void { }
	public function onScroller(scrolledField:TextField):Void { }
	public function onSetFocus(oldFocus:Object):Void { }

}
