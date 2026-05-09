const fs = require('fs');
const path = './src/pages/Home.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove import logout
content = content.replace(/import { logout } from "..\/api\/auth";\n/, '');

// Remove showUserMenu state
content = content.replace(/  const \[showUserMenu, setShowUserMenu\] = useState\(false\);\n/, '');

// Remove user state and handleLogout
content = content.replace(/  \/\/ Lấy user từ localStorage[\s\S]*?navigate\("\/"\);\n  };\n/, '');

// Remove Navbar
content = content.replace(/      {\/\* ===== HEADER \/ NAVIGATION ===== \*\/}[\s\S]*?<\/nav>\n\n/, '');

// Remove Footer
content = content.replace(/      {\/\* ===== FOOTER ===== \*\/}[\s\S]*?<\/footer>\n/, '');

fs.writeFileSync(path, content);
console.log('Done refactoring Home.jsx');
