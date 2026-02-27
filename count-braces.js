const fs = require('fs');
const content = fs.readFileSync('c:/Users/yashchahak/Documents/yatra-setu-connect/src/pages/EmployeePanel.tsx', 'utf8');
let openBraces = 0;
let closeBraces = 0;
for (let char of content) {
    if (char === '{') openBraces++;
    if (char === '}') closeBraces++;
}
console.log(`Open: ${openBraces}, Close: ${closeBraces}`);
