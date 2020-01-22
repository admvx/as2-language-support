import { ActionParser } from '../action-parser';
import { DirectoryUtility, LoadQueue } from '../file-system-utilities';

const jsonPropMatcher = /"(\w+)":/g;
const intrinsicPaths: string[] = ['./assets/intrinsic-classes', './assets/intrinsic-classes/System', './assets/intrinsic-classes/TextField'];
let fileList: string[];

ActionParser.initialise()
  .then(() => Promise.all(intrinsicPaths.map(path => DirectoryUtility.fileNamesInDirectory(path, /\.as$/i, true, false))))
  .then(_ => {
    fileList = (<string[][]><any>_).reduce((acc, val) => acc.concat(val), []);
    return Promise.all(fileList.map(path => LoadQueue.enqueue(path, false)));
  })
  .then(_ => {
    let fileContents: string[] = <any>_;
    let pickleSrc = `import { PickledClass } from './action-elements';\n\nexport const pickles: PickledClass[] = [\n  `;
    for (let i = 0, l = fileList.length; i < l; i++) {
      pickleSrc += ActionParser.parseFile(fileList[i], fileContents[i], false, true).toPickle().replace(jsonPropMatcher, '$1:');
      pickleSrc += i === l-1 ? '\n];' : ',\n  ';
    }
    console.log(pickleSrc);
  });
