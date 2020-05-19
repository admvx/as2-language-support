class Date {
  public function Date(year: Number, month: Number, date: Number, hour: Number, min: Number, sec: Number, ms: Number) { }

  public function getFullYear(): Number { }
  public function getYear(): Number { }
  public function getMonth(): Number { }
  public function getDate(): Number { }
  public function getDay(): Number { }
  public function getHours(): Number { }
  public function getMinutes(): Number { }
  public function getSeconds(): Number { }
  public function getMilliseconds(): Number { }

  public function getUTCFullYear(): Number { }
  public function getUTCYear(): Number { }
  public function getUTCMonth(): Number { }
  public function getUTCDate(): Number { }
  public function getUTCDay(): Number { }
  public function getUTCHours(): Number { }
  public function getUTCMinutes(): Number { }
  public function getUTCSeconds(): Number { }
  public function getUTCMilliseconds(): Number { }

  public function setFullYear(value: Number): Void { }
  public function setMonth(value: Number): Void { }
  public function setDate(value: Number): Void { }
  public function setHours(value: Number): Void { }
  public function setMinutes(value: Number): Void { }
  public function setSeconds(value: Number): Void { }
  public function setMilliseconds(value: Number): Void { }

  public function setUTCFullYear(value: Number): Void { }
  public function setUTCMonth(value: Number): Void { }
  public function setUTCDate(value: Number): Void { }
  public function setUTCHours(value: Number): Void { }
  public function setUTCMinutes(value: Number): Void { }
  public function setUTCSeconds(value: Number): Void { }
  public function setUTCMilliseconds(value: Number): Void { }

  public function getTime(): Number { }
  public function setTime(value: Number): Void { }
  public function getTimezoneOffset(): Number { }
  public function toString(): String { }
  public function valueOf(): Number { }
  public function setYear(value: Number): Void { }


  // Flash Lite 2.x
  public function getLocaleLongDate(): String { }
  public function getLocaleShortDate(): String { }
  public function getLocaleTime(): String { }

  public static function UTC(year: Number, month: Number, date: Number, hour: Number, min: Number, sec: Number, ms: Number): Number { }
}
