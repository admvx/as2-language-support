class XMLNode {
  public var attributes: Object;
  public var childNodes: Array;
  public var firstChild: XMLNode;
  public var lastChild: XMLNode;
  public var nextSibling: XMLNode;
  public var nodeName: String;
  public var nodeType: Number;
  public var nodeValue: String;
  public var parentNode: XMLNode;
  public var previousSibling: XMLNode;

  public function XMLNode(type: Number, value: String) { }

  public function cloneNode(deep: Boolean): XMLNode { }
  public function removeNode(): Void { }
  public function insertBefore(newChild: XMLNode, insertPoint: XMLNode): Void { }
  public function appendChild(newChild: XMLNode): Void { }
  public function hasChildNodes(): Boolean { }
  public function toString(): String { }

  public function addTreeNodeAt(index: Number, arg1: Object, arg2: Object): XMLNode { }
  public function addTreeNode(arg1: Object, arg2: Object): XMLNode { }
  public function getTreeNodeAt(index: Number): XMLNode { }
  public function removeTreeNodeAt(index: Number): XMLNode { }
  public function removeTreeNode(): XMLNode { }
}
