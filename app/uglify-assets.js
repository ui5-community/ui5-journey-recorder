const UglifyJS = require("uglify-js");
const fs = require("fs");
const path = require("path");

const asset_script_path = "dist/ui5-testrecorder/assets/scripts/";
const map_path = "source_maps";

const options = {
  compress: {
    drop_console: true
  },
  /* sourceMap: {}, */
  nameCache: {}
};

function byte_size(size) {
  const size_map = {
    0: 'B',
    1: 'kB',
    2: 'mB',
    3: 'gB'
  }
  let divided = 0;
  while (size > 1024) {
    size = size / 1024.0;
  }
  return `${Math.floor(size * 100) / 100.0} ${size_map[divided]}`;
}

function show_compression(script_name, bytes_before, bytes_after) {
  console.log(`${script_name} :: ${byte_size(bytes_before)} -> ${byte_size(bytes_after)} | ${Math.floor((bytes_after / bytes_before) * 10000) / 100.0} %`);
}

let size_before = 0;
let size_after = 0;

["starter.js", "page_inject.js", "content_inject.js", "communication_inject.js"].forEach(script_name => {
  /* options.sourceMap.filename = path.join(__dirname, asset_script_path, script_name);
  options.sourceMap.url = path.join(__dirname, map_path, `${script_name}.map`); */

  const content = fs.readFileSync(options.sourceMap.filename, 'utf-8');
  var result = UglifyJS.minify(content, options);
  fs.writeFileSync(options.sourceMap.filename, result.code, 'utf-8');
  fs.writeFileSync(options.sourceMap.url, result.map, 'utf-8');
  const before = (new TextEncoder().encode(content)).length;
  const after = (new TextEncoder().encode(result.code)).length;
  size_before += before;
  size_after += after;
  show_compression(script_name, before, after);
});

console.log(`Overall :: ${byte_size(size_before)} -> ${byte_size(size_after)} | ${(size_after / size_before) * 100}%`);
