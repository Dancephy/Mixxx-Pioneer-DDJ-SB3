const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const readFilePromise = file => new Promise((res, rej) => {
  fs.readFile(file, 'utf8', (err, content) => {
    if (err) {
      console.error(err);
      rej(err);
      return;
    }

    res(content);
  });
});

 // List all files in a directory in Node.js recursively in a synchronous fashion
 var walkSync = function(dir, filelist) {
        var path = path || require('path');
        var fs = fs || require('fs'),
            files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function(file) {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                filelist = walkSync(path.join(dir, file), filelist);
            }
            else {
                filelist.push(path.join(dir, file));
            }
        });
        return filelist;
    };

const mappingFiles = walkSync('xmls/mappings', []);

readFilePromise('xmls/root.xml').then(rootContent => {
  return xml2js.parseStringPromise(rootContent).then(rootXml => {
    console.log(rootXml.MixxxControllerPreset);
    rootXml.MixxxControllerPreset.controller = {
      scriptfiles: rootXml.MixxxControllerPreset.controller[0].scriptfiles,
      controls: [{ control: [] }],
      outputs: [{ output: [] }],
    };

    const maps = mappingFiles.map(mappingFile => {
      return readFilePromise(mappingFile).then(mappingData => {
        return xml2js.parseStringPromise(mappingData).then(mappingXml => {

          rootXml.MixxxControllerPreset.controller.controls[0].control = [
            ...rootXml.MixxxControllerPreset.controller.controls[0].control,
            ...((mappingXml.controller.controls || [])[0] || {}).control,
          ];

          rootXml.MixxxControllerPreset.controller.outputs[0].output = [
            ...rootXml.MixxxControllerPreset.controller.outputs[0].output,
            ...(((mappingXml.controller.outputs || [])[0] || {}).output || []),
          ];

        });
      }).catch(err => console.log("File failed: ", mappingFile, err));
    });

    Promise.all(maps).then(() => {
      var builder = new xml2js.Builder();
      var xml = builder.buildObject(rootXml);

      fs.writeFile('Pioneer-DDJ-SB3.midi.xml', xml, 'utf8', console.log);
    });

  });
}).catch(console.log);
