class Camera
{
	public static var names:Array;
	public static function get(index:Number):Camera;

	public var nativeModes:Array;
	public var keyFrameInterval:Number;
	public var bandwidth:Number;
	public var motionLevel:Number;
	public var motionTimeOut:Number;
	public var quality:Number;
	public var loopback:Boolean;
	public var width:Number;
	public var height:Number;
	public var fps:Number;
	public var activityLevel:Number;
	public var muted:Boolean;
	public var currentFps:Number;
	public var name:String;
	public var index:Number;

	public function setKeyFrameInterval(keyFrameInterval:Number):Void { }
	public function setLoopback(compress:Boolean):Void { }
	public function setMode(width:Number,height:Number,fps:Number,favorArea:Boolean):Void { }
	public function setMotionLevel(motionLevel:Number,timeOut:Number):Void { }
	public function setQuality(bandwidth:Number,quality:Number):Void { }

	public function onActivity(active:Boolean):Void { }
	public function onStatus(infoObject:Object):Void { }
}


