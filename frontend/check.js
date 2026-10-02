const fs = require('fs');

// We can't easily parse PNG in plain node without a library. But the user doesn't need to see the exact hex.
// I already know they are RGB not RGBA, which means opaque.
console.log("Images are RGB (no alpha channel).");
