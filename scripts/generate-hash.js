const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('\nUsage: npm run hash -- "your-chosen-password"\n');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

console.log('\nAdd this to your environment variables as ADMIN_PASSWORD_HASH:\n');
console.log(hash);
console.log('');
