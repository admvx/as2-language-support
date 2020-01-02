class MovieClip
{
	public var useHandCursor:Boolean;
	public var enabled:Boolean;
	public var focusEnabled:Boolean;
	public var tabChildren:Boolean;
	public var tabEnabled:Boolean;
	public var tabIndex:Number;
	public var hitArea:Object;
	public var trackAsMenu:Boolean;

	public var _x:Number;
	public var _y:Number;
	public var _xmouse:Number;
	public var _ymouse:Number;
	public var _xscale:Number;
	public var _yscale:Number;
	public var _width:Number;
	public var _height:Number;
	public var _alpha:Number;
	public var _lockroot:Boolean;
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
	public var menu:ContextMenu;

	public function getURL(url:String,window:String,method:String):Void { }
	public function unloadMovie():Void { }
	public function loadVariables(url:String,method:String):Void { }
	public function loadMovie(url:String,method:String):Void { }
	public function attachMovie(id:String,name:String,depth:Number,initObject:Object):MovieClip { }
	public function swapDepths(mc:Object):Void { }
	public function localToGlobal(pt:Object):Void { }
	public function globalToLocal(pt:Object):Void { }
	public function hitTest():Boolean { }
	public function getBounds(bounds:Object):Object { }
	public function getSWFVersion():Number { }
	public function getBytesLoaded():Number { }
	public function getBytesTotal():Number { }
	public function attachAudio(id:Object):Void { }
	public function attachVideo(id:Object):Void { }
	public function getDepth():Number { }
	public function getInstanceAtDepth(depth:Number):MovieClip { }
	public function getNextHighestDepth():Number { }
	public function setMask(mc:Object):Void { }
	public function play():Void { }
	public function stop():Void { }
	public function nextFrame():Void { }
	public function prevFrame():Void { }
	public function gotoAndPlay(frame:Object):Void { }
	public function gotoAndStop(frame:Object):Void { }
	public function duplicateMovieClip(name:String,depth:Number,initObject:Object):MovieClip { }
	public function removeMovieClip():Void { }
	public function startDrag(lockCenter:Boolean,left:Number,top:Number,right:Number,bottom:Number):Void { }
	public function stopDrag():Void { }
	public function createEmptyMovieClip(name:String,depth:Number):MovieClip { }
	public function beginFill(rgb:Number,alpha:Number):Void { }
	public function beginGradientFill(fillType:String,colors:Array,alphas:Array,ratios:Array,matrix:Object):Void { }
	public function moveTo(x:Number,y:Number):Void { }
	public function lineTo(x:Number,y:Number):Void { }
	public function curveTo(controlX:Number,controlY:Number,anchorX:Number,anchorY:Number):Void { }
	public function lineStyle(thickness:Number,rgb:Number,alpha:Number):Void { }
	public function endFill():Void { }
	public function clear():Void { }
	public function createTextField(instanceName:String,depth:Number,x:Number,y:Number,width:Number,height:Number):Void { }
	public function getTextSnapshot():TextSnapshot { }

	public function onData():Void { }
	public function onDragOut():Void { }
	public function onDragOver():Void { }
	public function onEnterFrame():Void { }
	public function onKeyDown():Void { }
	public function onKeyUp():Void { }
	public function onKillFocus(newFocus:Object):Void { }
	public function onLoad():Void { }
	public function onMouseDown():Void { }
	public function onMouseMove():Void { }
	public function onMouseUp():Void { }
	public function onPress():Void { }
	public function onRelease():Void { }
	public function onReleaseOutside():Void { }
	public function onRollOut():Void { }
	public function onRollOver():Void { }
	public function onSetFocus(oldFocus:Object):Void { }
	public function onUnload():Void { }

}


