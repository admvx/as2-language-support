//This file tests AS2 parsing capability

class package.ParseTest extends MovieClip {

  public var memberA: String = "value";
  private var memberB: Number = 5;
  public static var memberC: Boolean = false;
  private static var memberD: Object = { a: 1, b: true };
  var memberE: MovieClip;
  static public var memberF;
  //static var memberG;
  
  public function ParseTest() {
    super();
  }
  
  /*_class_body_*/
  
  public function methodA(arg1: String, arg2: Number): String {
    this._visible = false;
    var inline1: String = 'var tripUp1: Number = 3, tripUp2: String = \'', inline2: Object = { a: 1, b: 2 };
    
    //No completions expected here
    var inline3:String = 'Nor here';
    return inline3;
  }
    
  private function methodB(arg1: Boolean, arg2: Object): Void {
    /*_instance_method_*/
    var inline1: String = "var tripUp1: Number = 3, tripUp2: String = 'abc'"//, tripUp3:String;
  }
    
  public static function methodC(): Void {
    ParseTest.memberC = true;
    var /* mid-expression block comment */abcdef;
  }
    
  private static function methodD(): Void {
    /*_static_method_*/
    var inline1: String = 'var something:Number = \', ';
  }
  
}
