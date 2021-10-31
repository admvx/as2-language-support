import * as fse from 'fs-extra';
import * as path from 'path';
import { ActionParser } from '../action-parser';
import { ActionClass, ActionMethod, VisibilityFilter } from '../action-elements';

const asPath = path.resolve(__dirname, './__fixtures__/ParseTest.as');
const testClassName = 'package.ParseTest';
const testClassShortName = 'ParseTest';
const instanceMethodSearchToken = '/*_instance_method_*/';

let testClassContent = fse.readFileSync(asPath).toString();
let parsedClass: ActionClass;

test(`Test class content should load successfully`, () => {
  expect(testClassContent).toBeTruthy();
});

test(`Basic class parsing should succeed`, () => {
  parsedClass = ActionParser.parseFile(``, testClassContent, true, false);
  expect(parsedClass).toBeTruthy();
  expect(parsedClass.fullType).toBe(testClassName);
  expect(parsedClass.shortType).toBe(testClassShortName);
});

test(`Parsed class should match stored snapshot`, () => {
  expect(parsedClass).toMatchSnapshot();
});

test(`Parsed class should index class members correctly`, () => {
  expect(parsedClass.publicStaticMembers.length).toBe(3);
  expect(parsedClass.publicInstanceMembers.length).toBe(3);
  expect(parsedClass.staticMembers.length).toBe(5);
  expect(parsedClass.members.length).toBe(13);
});

test(`Parsed class should index methods and locals correctly`, async () => {
  let [parsedMethod, _] = <[ActionMethod, ActionClass]> await parsedClass.getMemberByName(`methodA`);
  expect(parsedMethod.isMethod).toBe(true);
  expect(parsedMethod.returnType).toBe(`String`);
  expect(parsedMethod.parameters.length).toBe(2);
  expect(parsedMethod.locals.length).toBe(3);
  expect(parsedMethod.scopedMembers.length).toBe(5);
});

test(`Mid statement block comments shouldn't trip up the parser`, async () => {
  let [parsedMethod, _] = <[ActionMethod, ActionClass]>await parsedClass.getMemberByName(`methodC`, VisibilityFilter.PUBLIC_STATIC);
  expect(parsedMethod.isMethod).toBe(true);
  expect(parsedMethod.locals.length).toBe(1);
  expect(parsedMethod.locals[0].name).not.toBe('bcdef'); // Described in Github issue #36
  expect(parsedMethod.locals[0].name).toBe('abcdef');
});

test(`Syntax errors shouldn't trip up the parser`, () => {
  let unterminatedString = `var a: String = '---------------------------------------------------\\'`;
  let unsyntacticalContent = testClassContent.replace(instanceMethodSearchToken, unterminatedString);
  let unsyntacticalClass = ActionParser.parseFile(``, unsyntacticalContent, true, false);
  expect(unsyntacticalClass.fullType).toBe(testClassName);
});
