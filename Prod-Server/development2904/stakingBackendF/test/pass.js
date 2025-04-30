const bcrypt = require("bcrypt");

async function generateHash() {
    const hashedPassword = await bcrypt.hash("Admin@1234", 10);
    console.log(hashedPassword);
}

generateHash();