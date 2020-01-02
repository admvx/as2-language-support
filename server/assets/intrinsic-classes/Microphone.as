class Microphone
{
	public static var names:Array;
	public static function get(index:Number):Microphone { }

	public var gain:Number;
	public var index:Number;
	public var activityLevel:Number;
	public var name:String;
	public var silenceLevel:Number;
	public var silenceTimeOut:Number;
	public var rate:Number;
	public var useEchoSuppression:Boolean;
	public var muted:Boolean;
	
	public function setSilenceLevel(silenceLevel:Number,timeOut:Number):Void { }
	public function setRate(rate:Number):Void { }
	public function setGain(gain:Number):Void { }
	public function setUseEchoSuppression(useEchoSuppression:Boolean):Void { }
	
	public function onActivity(active:Boolean):Void { }
	public function onStatus(infoObject:Object):Void { }
}



