class TextSnapshot
{
	public function findText(startIndex:Number, textToFind:String, caseSensitive:Boolean):Number { }
	public function getCount():Number { }
	public function getSelected(start:Number, end:Number):Boolean { }
	public function getSelectedText(includeLineEndings:Boolean):String { }
	public function getText(start:Number, end:Number, includeLineEndings:Boolean):String { }
	public function hitTestTextNearPos(x:Number, y:Number, closeDist:Number):Number { }
	public function setSelectColor(color:Number):Void { }
	public function setSelected(start:Number, end:Number, select:Boolean):Void { }

	public function getTextRunInfo(beginIndex:Number, endIndex:Number):Array { }
}


