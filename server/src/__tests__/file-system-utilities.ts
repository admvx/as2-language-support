import * as path from 'path';
import { DirectoryUtility, LoadQueue } from '../file-system-utilities';

const fixturesPath = path.resolve(__dirname, './__fixtures__/');

test(`DirectoryUtility should retrieve file names from a given directory`, async () => {
  expect((await DirectoryUtility.fileNamesInDirectory(fixturesPath, null, true, false)).length).toBeGreaterThan(0);
});

test(`DirectoryUtility should filter retrieved files names by pattern`, async () => {
  expect((await DirectoryUtility.fileNamesInDirectory(fixturesPath, /\.as$/, true, false)).length).toBeGreaterThan(0);
  expect((await DirectoryUtility.fileNamesInDirectory(fixturesPath, /bogus/, true, false)).length).toBe(0);
});

test(`DirectoryUtility should convert packages and fully qualified class names to paths`, () => {
  expect(DirectoryUtility.typeToPath(`outer_package.inner_package`)).toBe(`outer_package/inner_package`);
  expect(DirectoryUtility.typeToPath(`outer_package.inner_package.Class`)).toBe(`outer_package/inner_package/Class`);
});

test(`DirectoryUtility should determine the base URI from a file URI and its fully qualified class name`, () => {
  let path = `file:///misc/folders/before/src/outer_package/inner_package/Class.as`;
  let fullyQualifiedType = `outer_package.inner_package.Class`;
  expect(DirectoryUtility.fileUriAndTypeToBaseUri(path, fullyQualifiedType)).toBe(`file:///misc/folders/before/src`);
});

