require('./public-path.js');
// eslint-disable-next-line no-console
const process = global.process;
if(process && process.env){
    console.log('External React App (entry.js)', { process, NODE_ENV: process.env.NODE_ENV, window });
} else {
    console.log('process is not defined (entry.js)',);
}
require('./App.js').run({
    containerId: "adlace-container"
});
